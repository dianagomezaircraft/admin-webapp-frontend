'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Heart,
  BookOpen,
  ChevronRight,
  Loader2,
  AlertCircle,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { favoritesService, type ChapterFavorite } from '@/lib/favorites';
import { FavoriteButton } from '@/components/ui/FavoriteButton';

type SortOption = 'newest' | 'oldest' | 'az' | 'za';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest saved',
  oldest: 'Oldest saved',
  az:     'A → Z',
  za:     'Z → A',
};

export default function FavoritesPage() {
  const [favorites, setFavorites]       = useState<ChapterFavorite[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [removingId, setRemovingId]     = useState<string | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [sortBy, setSortBy]             = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // ── Load ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await favoritesService.getAll();
      setFavorites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Wired to FavoriteButton's onToggle. When the user un-hearts a chapter
   * from this page, remove it from the list optimistically.
   */
  const handleFavoriteToggle = (chapterId: string, nowFavorited: boolean) => {
    if (!nowFavorited) {
      setRemovingId(chapterId);
      // Brief delay so the fade-out animation is visible
      setTimeout(() => {
        setFavorites((prev) => prev.filter((f) => f.chapterId !== chapterId));
        setRemovingId(null);
      }, 300);
    }
  };

  // ── Derived list ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = [...favorites];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.chapter.title.toLowerCase().includes(q) ||
          f.chapter.airline.name.toLowerCase().includes(q) ||
          f.chapter.description?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'az':     return a.chapter.title.localeCompare(b.chapter.title);
        case 'za':     return b.chapter.title.localeCompare(a.chapter.title);
        default:       return 0;
      }
    });

    return result;
  }, [favorites, searchQuery, sortBy]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now  = new Date();
    const diffDays = Math.floor(
      Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)  return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            Favorite Chapters
          </h2>
          <p className="text-gray-600 mt-1">
            Chapters you&apos;ve saved for quick access
            {!loading && favorites.length > 0 && (
              <span className="ml-1 text-gray-400">({favorites.length})</span>
            )}
          </p>
        </div>
        <Link href="/dashboard/manuals">
          <Button variant="secondary">
            <BookOpen className="w-4 h-4 mr-2" />
            Browse Manuals
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Error loading favorites</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <Button onClick={loadFavorites} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search + Sort */}
      {!loading && favorites.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title or airline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSortMenu((v) => !v)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {SORT_LABELS[sortBy]}
            </Button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200
                                rounded-lg shadow-lg z-20 py-1 overflow-hidden">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSortBy(opt); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        sortBy === opt
                          ? 'text-blue-600 font-medium bg-blue-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {SORT_LABELS[opt]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <span className="text-sm text-gray-500 ml-auto whitespace-nowrap">
            {filtered.length} of {favorites.length}
          </span>
        </div>
      )}

      {/* Empty — no favorites */}
      {!loading && !error && favorites.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7 text-red-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-6 max-w-xs mx-auto">
              Tap the heart icon on any chapter to save it here for quick access.
            </p>
            <Link href="/dashboard/manuals">
              <Button>
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Manuals
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Empty — search no results */}
      {!loading && !error && favorites.length > 0 && filtered.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">
              No results for &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-blue-600 hover:underline mt-1"
            >
              Clear search
            </button>
          </CardContent>
        </Card>
      )}

      {/* Favorites list — same row layout as manuals page */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((favorite) => {
            const chapter    = favorite.chapter;
            const isRemoving = removingId === favorite.chapterId;

            return (
              <div
                key={favorite.id}
                className={`transition-all duration-300 ${
                  isRemoving ? 'opacity-0 scale-[0.98]' : 'opacity-100'
                }`}
              >
                <Link href={`/dashboard/manuals/${chapter.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">

                          {/* Thumbnail or fallback */}
                          {chapter.imageUrl ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={chapter.imageUrl}
                                alt={chapter.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-6 h-6 text-rose-500" />
                            </div>
                          )}

                          {/* Title + meta */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {chapter.title}
                              </h3>
                              {!chapter.active && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded flex-shrink-0">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 mt-1 flex-wrap gap-y-1">
                              <span className="text-sm text-blue-600 font-medium">
                                {chapter.airline.name}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-sm text-gray-500">
                                {chapter._count.sections} section{chapter._count.sections !== 1 ? 's' : ''}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-sm text-gray-500">
                                Saved {formatDate(favorite.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Heart toggle — clicking it removes from this list */}
                          <FavoriteButton
                            chapterId={chapter.id}
                            isFavorited={true}
                            onToggle={handleFavoriteToggle}
                          />
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {!loading && !error && filtered.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Showing {filtered.length} of {favorites.length} favorites
          </p>
        </div>
      )}
    </div>
  );
}