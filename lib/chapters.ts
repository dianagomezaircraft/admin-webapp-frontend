// lib/chapters.ts - UPDATED VERSION
import { fetchWithAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  active: boolean;
  airlineId: string;
  imageUrl?: string;
  
  // ✨ Template fields
  templateId?: string;
  isTemplate: boolean;
  templateVersion: number;
  lastSyncedAt?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // Optional relations
  airline?: {
    id: string;
    name: string;
    code: string;
  };
  template?: {
    id: string;
    title: string;
    airline?: {
      name: string;
      code: string;
    };
  };
  _count?: {
    sections?: number;
    forkedChapters?: number;
  };
}

export interface Airline {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

export interface ChaptersResponse {
  success: boolean;
  data: Chapter[];
}

export interface ChapterResponse {
  success: boolean;
  data: Chapter;
}

export interface CreateChapterData {
  title: string;
  description?: string;
  airlineId: string;
  active?: boolean;
  imageUrl?: string;
}

export interface UpdateChapterData {
  title?: string;
  description?: string;
  order?: number;
  active?: boolean;
  imageUrl?: string;
}

export const chaptersService = {
  async getAll(airlineId?: string, includeInactive?: boolean): Promise<Chapter[]> {
    const params = new URLSearchParams();
    if (airlineId) params.append('airlineId', airlineId);
    if (includeInactive !== undefined) params.append('includeInactive', String(includeInactive));
    
    const url = `${API_URL}/chapters${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch chapters');
    }

    const result: ChaptersResponse = await response.json();
    return result.data;
  },

  async getAirlines(): Promise<Airline[]> {
    const response = await fetchWithAuth(`${API_URL}/airlines`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch airlines');
    }

    const result = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<Chapter> {
    const response = await fetchWithAuth(`${API_URL}/chapters/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch chapter');
    }

    const result: ChapterResponse = await response.json();
    return result.data;
  },

  async create(data: CreateChapterData): Promise<Chapter> {
    const response = await fetchWithAuth(`${API_URL}/chapters`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create chapter');
    }

    const result: ChapterResponse = await response.json();
    return result.data;
  },

  async update(id: string, data: UpdateChapterData): Promise<Chapter> {
    const response = await fetchWithAuth(`${API_URL}/chapters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update chapter');
    }

    const result: ChapterResponse = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/chapters/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete chapter');
    }
  },
};