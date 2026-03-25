import { fetchWithAuth } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FavoriteAirline {
  id: string;
  name: string;
  code: string;
  logo: string | null;
}

export interface FavoriteChapter {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  updatedAt: string;
  airline: FavoriteAirline;
  _count: { sections: number };
}

export interface ChapterFavorite {
  id: string;
  userId: string;
  chapterId: string;
  createdAt: string;
  chapter: FavoriteChapter;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
};

// ─── Service ─────────────────────────────────────────────────────────────────
// Uses fetchWithAuth so the Authorization header is always attached,
// and expired tokens are refreshed automatically.

export const favoritesService = {
  /** Get all favorited chapters (full data) */
  async getAll(): Promise<ChapterFavorite[]> {
    const res = await fetchWithAuth(`${API_BASE}/favorites`);
    return handleResponse<ChapterFavorite[]>(res);
  },

  /**
   * Get only the chapter IDs the user has favorited.
   * Cheap to call — useful for rendering toggle states on chapter cards.
   */
  async getIds(): Promise<string[]> {
    const res = await fetchWithAuth(`${API_BASE}/favorites/ids`);
    return handleResponse<string[]>(res);
  },

  /** Add a chapter to favorites (idempotent) */
  async add(chapterId: string): Promise<ChapterFavorite> {
    const res = await fetchWithAuth(`${API_BASE}/favorites/${chapterId}`, {
      method: 'POST',
    });
    return handleResponse<ChapterFavorite>(res);
  },

  /** Remove a chapter from favorites */
  async remove(chapterId: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/favorites/${chapterId}`, {
      method: 'DELETE',
    });
    await handleResponse<{ success: boolean }>(res);
  },
};