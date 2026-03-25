// lib/templates.ts
import { fetchWithAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ============================================
// TYPES & INTERFACES
// ============================================
export interface ForkSyncStatus {
  id: string;
  title: string;
  airline: { id: string; name: string; code: string };
  forkVersion: number;
  templateVersion: number;
  isOutdated: boolean;
  lastSyncedAt?: string;
}

export interface TemplateSyncData {
  template: { id: string; title: string; templateVersion: number };
  forks: ForkSyncStatus[];
  outdatedCount: number;
  totalForks: number;
}
export interface TemplateChapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  active: boolean;
  airlineId: string;
  imageUrl?: string;
  isTemplate: boolean;
  templateId?: string;
  templateVersion: number;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  airline: {
    id: string;
    name: string;
    code: string;
  };
  template?: {
    id: string;
    title: string;
    airline: {
      name: string;
      code: string;
    };
  };
  _count?: {
    sections: number;
    forkedChapters: number;
  };
}

export interface TemplateUpdate {
  id: string;
  chapterId: string;
  templateId: string;
  status: 'pending' | 'approved' | 'rejected';
  changes: {
    title?: string;
    description?: string;
    imageUrl?: string;
  };
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  template?: {
    id: string;
    title: string;
    templateVersion: number;
  };
}

export interface UpdateCheckResult {
  success: boolean;
  hasUpdates: boolean;
  changes?: {
    currentVersion: number;
    latestVersion: number;
    templateTitle: string;
    templateLastUpdated: string;
  } | null;
}

export interface ForkTemplateData {
  targetAirlineId?: string; // Required for SUPER_ADMIN, optional for others
}

// ============================================
// TEMPLATE SERVICE
// ============================================

export const templatesService = {
  /**
   * Get all available templates
   */
  async getAllTemplates(): Promise<TemplateChapter[]> {
    const response = await fetchWithAuth(`${API_URL}/templates`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch templates');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Mark a chapter as template (SUPER_ADMIN only)
   */
  async markAsTemplate(chapterId: string): Promise<TemplateChapter> {
    const response = await fetchWithAuth(
      `${API_URL}/templates/${chapterId}/mark-as-template`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark chapter as template');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Fork a template to create a copy for an airline
   */
  async forkTemplate(
    templateId: string,
    data?: ForkTemplateData
  ): Promise<TemplateChapter> {
    const response = await fetchWithAuth(`${API_URL}/templates/${templateId}/fork`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to fork template');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get all forks of a template
   */
  async getTemplateForks(templateId: string): Promise<TemplateChapter[]> {
    const response = await fetchWithAuth(`${API_URL}/templates/${templateId}/forks`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch template forks');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get pending template updates for a chapter
   */
  async getPendingUpdates(chapterId: string): Promise<TemplateUpdate[]> {
    const response = await fetchWithAuth(
      `${API_URL}/templates/chapters/${chapterId}/updates`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch pending updates');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Check if there are updates available from template
   */
  async checkForUpdates(chapterId: string): Promise<UpdateCheckResult> {
    const response = await fetchWithAuth(
      `${API_URL}/templates/chapters/${chapterId}/check-updates`
    );

    if (!response.ok) {
      const error = await response.json();
      // If it's not a forked chapter, return no updates
      if (error.error?.includes('not forked')) {
        return {
          success: true,
          hasUpdates: false,
          changes: null,
        };
      }
      throw new Error(error.error || 'Failed to check for updates');
    }

    const result = await response.json();
    return result;
  },

  /**
   * Apply a template update to a forked chapter
   */
  async applyUpdate(updateId: string): Promise<TemplateChapter> {
    const response = await fetchWithAuth(
      `${API_URL}/templates/updates/${updateId}/apply`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to apply update');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Reject a template update
   */
  async rejectUpdate(updateId: string): Promise<TemplateUpdate> {
    const response = await fetchWithAuth(
      `${API_URL}/templates/updates/${updateId}/reject`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject update');
    }

    const result = await response.json();
    return result.data;
  },

  async getTemplateSyncStatus(templateId: string): Promise<TemplateSyncData> {
  const response = await fetchWithAuth(
    `${API_URL}/templates/${templateId}/sync-status`
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch sync status');
  }
  const result = await response.json();
  return result.data;
  },

  async pushToAllForks(
  templateId: string,
  forkIds?: string[]
): Promise<{ succeeded: string[]; failed: { forkId: string; error: string }[] }> {
  const response = await fetchWithAuth(
    `${API_URL}/templates/${templateId}/push-to-forks`,
    {
      method: 'POST',
      body: JSON.stringify({ forkIds }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to push updates');
  }
  const result = await response.json();
  return result.data;
},
  
};