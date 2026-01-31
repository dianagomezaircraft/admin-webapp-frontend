// lib/sections.ts
import { fetchWithAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  active: boolean;
  imageUrl?: string | null; // ✅ Agregado soporte para imágenes
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
  order?: number;
  active?: boolean;
  imageUrl?: string | null; // ✅ Agregado
  chapterId?: string; // Para compatibilidad con backend antiguo
}

export interface UpdateSectionData {
  title?: string;
  description?: string | null;
  order?: number;
  active?: boolean;
  imageUrl?: string | null; // ✅ Agregado
}

class SectionsService {

  
  /**
   * Get all sections for a chapter
   * Intenta primero con el endpoint RESTful, si falla usa el antiguo
   */
  async getAll(chapterId: string, includeInactive: boolean = false): Promise<Section[]> {
    try {
      // Intentar con endpoint RESTful primero
      const params = includeInactive ? '?includeInactive=true' : '';
      const response = await fetchWithAuth(`${API_URL}/chapters/${chapterId}/sections${params}`);
      
      if (!response.ok) {
        // Si falla, intentar con endpoint antiguo
        return this.getAllLegacy(chapterId, includeInactive);
      }
      
      const data: SectionsResponse = await response.json();
      return data.data;
    } catch (error) {
      // Si hay error de red, intentar con endpoint antiguo
      console.warn('RESTful endpoint failed, trying legacy endpoint:', error);
      return this.getAllLegacy(chapterId, includeInactive);
    }
  }

  /**
   * Método legacy para compatibilidad con backend antiguo
   */
  async getAllLegacy(chapterId: string, includeInactive: boolean = false): Promise<Section[]> {
    const params = new URLSearchParams();
    params.append('chapterId', chapterId);
    if (includeInactive) params.append('includeInactive', 'true');
    
    const url = `${API_URL}/sections?${params.toString()}`;
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch sections');
    }

    const result: SectionsResponse = await response.json();
    return result.data;
  }

  /**
   * Alias para mantener compatibilidad con código existente
   * @deprecated Use getAll instead
   */
  async getAllByChapter(chapterId: string, includeInactive?: boolean): Promise<Section[]> {
    return this.getAll(chapterId, includeInactive || false);
  }

  /**
   * Get section by ID
   */
  async getById(id: string): Promise<Section> {
    const response = await fetchWithAuth(`${API_URL}/sections/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load section');
    }
    
    const data: SectionResponse = await response.json();
    return data.data;
  }

  

  /**
   * Método legacy para crear sección
   */
 async create(chapterId: string, data: CreateSectionData): Promise<Section> {
    const response = await fetchWithAuth(`${API_URL}/sections`, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        chapterId, // Agregar chapterId al body para endpoint antiguo
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create section');
    }

    const result: SectionResponse = await response.json();
    return result.data;
  }

  /**
   * Update section
   */
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
  }

  /**
   * Delete section
   */
  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/sections/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete section');
    }
  }
}

export const sectionsService = new SectionsService();