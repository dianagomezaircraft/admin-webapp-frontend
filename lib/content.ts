// lib/content.ts
import { fetchWithAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export type ContentType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'PDF';

export interface Content {
  id: string;
  title: string;
  content: string;
  type: ContentType;
  order: number;
  metadata: Record<string, unknown>;
  active: boolean;
  sectionId: string;
  createdAt: string;
  updatedAt: string;
  section: {
    id: string;
    title: string;
    chapter: {
      id: string;
      title: string;
      airlineId: string;
    };
  };
}

export interface ContentsResponse {
  success: boolean;
  data: Content[];
  count: number;
}

export interface ContentResponse {
  success: boolean;
  data: Content;
  message?: string;
}

export interface CreateContentData {
  title: string;
  content: string;
  type: ContentType;
  sectionId: string;
  order?: number;
  metadata?: Record<string, unknown>;
  active?: boolean;
}

export interface UpdateContentData {
  title?: string;
  content?: string;
  type?: ContentType;
  order?: number;
  metadata?: Record<string, unknown>;
  active?: boolean;
}

export interface SearchContentParams {
  query: string;
  chapterId?: string;
}

export const contentService = {
  /**
   * GET /api/contents/sections/:sectionId
   * Get all content for a section
   */
  async getAllBySection(sectionId: string, includeInactive?: boolean): Promise<Content[]> {
    const params = new URLSearchParams();
    if (includeInactive !== undefined) {
      params.append('includeInactive', String(includeInactive));
    }
    
    const queryString = params.toString();
    const url = `${API_URL}/contents/sections/${sectionId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch content');
    }

    const result: ContentsResponse = await response.json();
    return result.data;
  },

  /**
   * GET /api/contents/:id
   * Get single content by ID
   */
  async getById(id: string): Promise<Content> {
    const response = await fetchWithAuth(`${API_URL}/contents/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch content');
    }

    const result: ContentResponse = await response.json();
    return result.data;
  },

  /**
   * POST /api/contents/sections/:sectionId/contents
   * Create new content
   */
  async create(data: CreateContentData): Promise<Content> {
    const { sectionId, ...contentData } = data;
    
    const response = await fetchWithAuth(
      `${API_URL}/contents/sections/${sectionId}/contents`,
      {
        method: 'POST',
        body: JSON.stringify(contentData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create content');
    }

    const result: ContentResponse = await response.json();
    return result.data;
  },

  /**
   * PUT /api/contents/:id
   * Update existing content
   */
  async update(id: string, data: UpdateContentData): Promise<Content> {
    const response = await fetchWithAuth(`${API_URL}/contents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update content');
    }

    const result: ContentResponse = await response.json();
    return result.data;
  },

  /**
   * DELETE /api/contents/:id
   * Delete content
   */
  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/contents/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete content');
    }
  },

  /**
   * GET /api/contents/search?query=xxx&chapterId=xxx
   * Search content (if this route exists in your backend)
   */
  async search(params: SearchContentParams): Promise<Content[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('query', params.query);
    if (params.chapterId) {
      searchParams.append('chapterId', params.chapterId);
    }

    const url = `${API_URL}/contents/search?${searchParams.toString()}`;
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search content');
    }

    const result: ContentsResponse = await response.json();
    return result.data;
  },
};