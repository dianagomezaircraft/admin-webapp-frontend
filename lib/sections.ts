// lib/sections.ts
import { fetchWithAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  active: boolean;
  chapterId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SectionsResponse {
  success: boolean;
  data: Section[];
  count: number;
}

export interface SectionResponse {
  success: boolean;
  data: Section;
  message?: string;
}

export interface CreateSectionData {
  title: string;
  description?: string | null;
  order: number;
  chapterId: string;
  active?: boolean;
}

export interface UpdateSectionData {
  title?: string;
  description?: string | null;
  order?: number;
  active?: boolean;
}

export const sectionsService = {
  async getAllByChapter(chapterId: string, includeInactive?: boolean): Promise<Section[]> {
    const params = new URLSearchParams();
    params.append('chapterId', chapterId);
    if (includeInactive !== undefined) params.append('includeInactive', String(includeInactive));
    
    const url = `${API_URL}/sections?${params.toString()}`;
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch sections');
    }

    const result: SectionsResponse = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<Section> {
    const response = await fetchWithAuth(`${API_URL}/sections/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch section');
    }

    const result: SectionResponse = await response.json();
    return result.data;
  },

  async create(data: CreateSectionData): Promise<Section> {
    const response = await fetchWithAuth(`${API_URL}/sections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create section');
    }

    const result: SectionResponse = await response.json();
    return result.data;
  },

  async update(id: string, data: UpdateSectionData): Promise<Section> {
    const response = await fetchWithAuth(`${API_URL}/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update section');
    }

    const result: SectionResponse = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/sections/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete section');
    }
  },
};