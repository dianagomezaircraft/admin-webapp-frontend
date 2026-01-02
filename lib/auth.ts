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

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    document.cookie = 'accessToken=; max-age=0; path=/';
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
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
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const newAuth = await authService.refreshToken(refreshToken);
        localStorage.setItem('accessToken', newAuth.data.accessToken);
        localStorage.setItem('refreshToken', newAuth.data.refreshToken);
        
        // Reintentar la petición original
        headers.Authorization = `Bearer ${newAuth.data.accessToken}`;
        return fetch(url, { ...options, headers });
      } catch (error) {
        authService.logout();
        window.location.href = '/auth/login';
      }
    }
  }

  return response;
}