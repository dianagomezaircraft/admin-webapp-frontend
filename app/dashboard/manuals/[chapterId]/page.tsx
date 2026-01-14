'use client';

import { ArrowLeft, ChevronRight, Plus, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { use, useEffect, useState } from 'react';
import { chaptersService, Chapter } from '@/lib/chapters';
import { sectionsService, Section } from '@/lib/sections';

export default function ChapterPage({ 
  params 
}: { 
  params: Promise<{ chapterId: string }> 
}) {
  const unwrappedParams = use(params);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChapterAndSections();
  }, [unwrappedParams.chapterId]);

  const loadChapterAndSections = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load chapter details and sections in parallel
      const [chapterData, sectionsData] = await Promise.all([
        chaptersService.getById(unwrappedParams.chapterId),
        sectionsService.getAllByChapter(unwrappedParams.chapterId)
      ]);

      setChapter(chapterData);
      setSections(sectionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chapter');
      console.error('Error loading chapter:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm">
        <Link href="/dashboard/manuals" className="text-gray-600 hover:text-gray-900">
          Chapters
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-900">
          {loading ? 'Loading...' : chapter?.title || 'Chapter'}
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Error loading chapter</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <Button
              onClick={loadChapterAndSections}
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!loading && !error && chapter && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold text-gray-900">{chapter.title}</h2>
                {!chapter.active && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                {sections.length} {sections.length === 1 ? 'section' : 'sections'} • 
                Updated {formatDate(chapter.updatedAt)}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary">Edit Chapter</Button>
              <Link href={`/dashboard/manuals/${unwrappedParams.chapterId}/sections/new`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </Link>
            </div>
          </div>

          {/* Empty State */}
          {sections.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📄</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No sections yet</h3>
                <p className="text-gray-600 mb-6">
                  Start building your chapter by adding sections
                </p>
                <Link href={`/dashboard/manuals/${unwrappedParams.chapterId}/sections/new`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Section
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Sections List */}
          {sections.length > 0 && (
            <div className="space-y-3">
              {sections.map((section) => (
                <Link 
                  key={section.id} 
                  href={`/dashboard/manuals/${unwrappedParams.chapterId}/sections/${section.id}`}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {section.order}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900">{section.title}</h3>
                              {!section.active && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                            {section.description && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                {section.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}