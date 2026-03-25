'use client';

import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { favoritesService } from '@/lib/favorites';

interface FavoriteButtonProps {
  chapterId: string;
  isFavorited: boolean;
  /** Called after a successful toggle so parent can update its state */
  onToggle?: (chapterId: string, nowFavorited: boolean) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Heart-toggle button that can be placed on any chapter card.
 *
 * Usage:
 *   <FavoriteButton
 *     chapterId={chapter.id}
 *     isFavorited={favoriteIds.includes(chapter.id)}
 *     onToggle={(id, favorited) => { ... }}
 *   />
 */
export function FavoriteButton({
  chapterId,
  isFavorited,
  onToggle,
  size = 'md',
  className = '',
}: FavoriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();   // prevent card-level link navigation
    e.stopPropagation();  // prevent event bubbling
    if (loading) return;

    try {
      setLoading(true);
      if (favorited) {
        await favoritesService.remove(chapterId);
        setFavorited(false);
        onToggle?.(chapterId, false);
      } else {
        await favoritesService.add(chapterId);
        setFavorited(true);
        onToggle?.(chapterId, true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      className={`
        inline-flex items-center justify-center rounded-full p-1.5
        transition-all duration-150
        hover:bg-red-50
        focus:outline-none focus:ring-2 focus:ring-red-300
        disabled:opacity-60 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className={`${iconSize} animate-spin text-gray-400`} />
      ) : (
        <Heart
          className={`${iconSize} transition-colors duration-150 ${
            favorited
              ? 'fill-red-500 text-red-500'
              : 'text-gray-400 hover:text-red-400'
          }`}
        />
      )}
    </button>
  );
}