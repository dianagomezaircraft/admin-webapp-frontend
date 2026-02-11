// lib/auth.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  airlineId?: string;
  airline?: {
    id: string;
    name: string;
    code: string;
    logo?: string;
  };
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthResponse {
  success: boolean;
  data: AuthData;
}

export interface RefreshTokenResponse {
  accessToken: string;
  user: User;
}

// Queue to store pending requests while refreshing token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    
    // Save auth data
    if (data.success) {
      this.saveAuthData(data.data);
    }

    return data;
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    return data.success ? data.data : data;
  },

  async logout(refreshToken?: string): Promise<void> {
    const tokenToUse = refreshToken || this.getRefreshToken();
    
    // Call backend logout endpoint if refresh token is provided
    if (tokenToUse) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: tokenToUse }),
        });
      } catch (error) {
        console.error('Backend logout error:', error);
        // Continue with local logout even if API call fails
      }
    }

    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Clear cookies
    document.cookie = 'accessToken=; max-age=0; path=/';
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  saveAuthData(data: AuthData): void {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  },
};

// Enhanced interceptor with automatic token refresh
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authService.getAccessToken();
  
  const headers: HeadersInit = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  let response = await fetch(url, { ...options, headers });

  // If token expired (401), try to refresh it
  if (response.status === 401) {
    const refreshToken = authService.getRefreshToken();
    
    if (!refreshToken) {
      // No refresh token, logout and redirect
      await authService.logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error('No refresh token available');
    }

    // If already refreshing, wait for it to complete
    if (isRefreshing) {
      return new Promise<Response>((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            const newHeaders: HeadersInit = {
              ...options.headers,
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            };
            resolve(fetch(url, { ...options, headers: newHeaders }));
          },
          reject,
        });
      });
    }

    // Start refresh process
    isRefreshing = true;

    try {
      // Refresh the token
      const newAuth = await authService.refreshToken(refreshToken);
      
      // Save new tokens
      authService.saveAuthData({
        accessToken: newAuth.accessToken,
        refreshToken: refreshToken, // Keep the same refresh token
        user: newAuth.user,
      });

      // Process queued requests
      processQueue(null, newAuth.accessToken);

      // Retry the original request with new token
      const retryHeaders: HeadersInit = {
        ...options.headers,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newAuth.accessToken}`,
      };
      response = await fetch(url, { ...options, headers: retryHeaders });

      return response;
    } catch (error) {
      // Refresh failed, logout
      processQueue(error as Error, null);
      await authService.logout();
      
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      
      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}

// Helper to decode JWT and check expiration
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch (error) {
    return true;
  }
}

// Proactive token refresh - call this periodically
export async function refreshTokenIfNeeded(): Promise<void> {
  const accessToken = authService.getAccessToken();
  const refreshToken = authService.getRefreshToken();

  if (!accessToken || !refreshToken) {
    return;
  }

  // Check if token expires in less than 2 minutes
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const exp = payload.exp * 1000;
    const timeUntilExpiry = exp - Date.now();
    const twoMinutes = 2 * 60 * 1000;

    if (timeUntilExpiry < twoMinutes && timeUntilExpiry > 0) {
      console.log('Token expiring soon, refreshing...');
      const newAuth = await authService.refreshToken(refreshToken);
      authService.saveAuthData({
        accessToken: newAuth.accessToken,
        refreshToken: refreshToken,
        user: newAuth.user,
      });
    }
  } catch (error) {
    console.error('Error checking token expiration:', error);
  }
}