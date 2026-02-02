'use client';

import { ChevronRight, Plus, Loader2, AlertCircle, Edit, Image as ImageIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { use, useEffect, useState } from 'react';
import { chaptersService, Chapter } from '@/lib/chapters';
import { sectionsService, Section } from '@/lib/sections';
import { useRouter } from 'next/navigation';

export default function ChapterPage({ 
  params 
}: { 
  params: Promise<{ chapterId: string }> 
}) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadChapterAndSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unwrappedParams.chapterId]);

  const loadChapterAndSections = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load chapter details and sections in parallel
      const [chapterData, sectionsData] = await Promise.all([
        chaptersService.getById(unwrappedParams.chapterId),
        sectionsService.getAllLegacy(unwrappedParams.chapterId)
      ]);

      setChapter(chapterData);
      setSections(sectionsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chapter';
      setError(errorMessage);
      console.error('Error loading chapter:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!chapter) return;

    try {
      setDeleting(true);
      await chaptersService.delete(chapter.id);
      
      // Redirect to chapters list after successful deletion
      router.push('/dashboard/manuals');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete chapter';
      setError(errorMessage);
      console.error('Error deleting chapter:', err);
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Chapter</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Are you sure you want to delete &quot;{chapter?.title}&quot;? 
                    {/* {sections.length > 0 && (
                      <span className="block mt-1 font-medium text-red-600">
                        This will also delete {sections.length} {sections.length === 1 ? 'section' : 'sections'}.
                      </span>
                    )} */}
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex space-x-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
              <Button 
                variant="secondary"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Link href={`/dashboard/manuals/${unwrappedParams.chapterId}/edit`}>
                <Button variant="secondary">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Chapter
                </Button>
              </Link>
              <Link href={`/dashboard/manuals/${unwrappedParams.chapterId}/sections/new`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </Link>
            </div>
          </div>

          {/* Chapter Image & Description */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chapter Image */}
            {chapter.imageUrl && (
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-0">
                    <Image
                      src={chapter.imageUrl}
                      alt={chapter.title}
                      width={400}
                      height={250}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Chapter Description */}
            {chapter.description && (
              <div className={chapter.imageUrl ? 'lg:col-span-2' : 'lg:col-span-3'}>
                <Card className="bg-blue-50 border-blue-200 h-full">
                  <CardContent className="p-4 flex items-center h-full">
                    <p className="text-sm text-blue-900">{chapter.description}</p>
                  </CardContent>
                </Card>
              </div>
            )}
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
                      <div className="flex items-center justify-between gap-4">
                        {/* Section Number & Content */}
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-blue-700">
                              {section.order}
                            </span>
                          </div>

                          {/* Section Image Thumbnail */}
                          {section.imageUrl && (
                            <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={section.imageUrl}
                                alt={section.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          {/* Section Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900 truncate">
                                {section.title}
                              </h3>
                              {!section.active && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded flex-shrink-0">
                                  Inactive
                                </span>
                              )}
                              {section.imageUrl && (
                                <ImageIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                              )}
                            </div>
                            {section.description && (
                              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                                {section.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
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