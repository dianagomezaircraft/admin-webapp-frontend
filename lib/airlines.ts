// lib/airlines.ts
import { fetchWithAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Airline {
  id: string;
  name: string;
  code: string;
  logo?: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    manualChapters: number;
  };
}

export interface AirlinesResponse {
  success: boolean;
  data: Airline[];
}

export const airlinesService = {
  async getAll(): Promise<Airline[]> {
    const response = await fetchWithAuth(`${API_URL}/airlines`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch airlines');
    }

    const result: AirlinesResponse = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<Airline> {
    const response = await fetchWithAuth(`${API_URL}/airlines/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch airline');
    }

    const result = await response.json();
    return result.data;
  },

  async create(data: Partial<Airline>): Promise<Airline> {
    const response = await fetchWithAuth(`${API_URL}/airlines`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create airline');
    }

    const result = await response.json();
    return result.data;
  },

  async update(id: string, data: Partial<Airline>): Promise<Airline> {
    const response = await fetchWithAuth(`${API_URL}/airlines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update airline');
    }

    const result = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/airlines/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete airline');
    }
  },
};