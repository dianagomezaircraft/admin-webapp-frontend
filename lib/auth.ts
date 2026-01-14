// lib/auth.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      airlineId?: string;
    };
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login/`, {
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

    return response.json();
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/refresh-token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  },

  async logout(refreshToken?: string): Promise<void> {
    // Call backend logout endpoint if refresh token is provided
    if (refreshToken) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
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

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  saveAuthData(data: AuthResponse['data']) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  },
};

// Interceptor para agregar el token a las peticiones
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = authService.getAccessToken();
  
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(url, { ...options, headers });

  // Si el token expiró, intentar refrescarlo
  if (response.status === 401) {
    const refreshToken = authService.getRefreshToken();
    if (refreshToken) {
      try {
        const newAuth = await authService.refreshToken(refreshToken);
        authService.saveAuthData(newAuth.data);
        
        // Reintentar la petición original
        headers.Authorization = `Bearer ${newAuth.data.accessToken}`;
        return fetch(url, { ...options, headers });
      } catch (error) {
        await authService.logout();
        window.location.href = '/auth/login';
        throw error;
      }
    } else {
      // No refresh token available, redirect to login
      await authService.logout();
      window.location.href = '/auth/login';
    }
  }

  return response;
}