// lib/users.ts
import { fetchWithAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  active: boolean;
  airlineId: string | null;
  airline: {
    id: string;
    name: string;
    code: string;
  };
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string | null;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export const usersService = {
  async getAll(): Promise<User[]> {
    const response = await fetchWithAuth(`${API_URL}/users`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch users');
    }

    const result: UsersResponse = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<User> {
    const response = await fetchWithAuth(`${API_URL}/users/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch user');
    }

    const result: UserResponse = await response.json();
    return result.data;
  },

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    airlineId: string;
    active?: boolean;
  }): Promise<User> {
    const response = await fetchWithAuth(`${API_URL}/users`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create user');
    }

    const result: UserResponse = await response.json();
    return result.data;
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const response = await fetchWithAuth(`${API_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user');
    }

    const result: UserResponse = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }
  },
};