'use client';

import { useState, useEffect, use } from 'react';
import { FileText, Image, Video, FileAudio, Loader2, AlertCircle } from 'lucide-react';
import { ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { sectionsService, Section } from '@/lib/sections';
import { contentService, Content, ContentType } from '@/lib/content';
import AddContentModal from '@/components/ui/AddContentModal';
import EditContentModal from '@/components/ui/EditContentModal';

const getContentIcon = (type: ContentType) => {
  const icons = {
    TEXT: FileText,
    IMAGE: Image,
    VIDEO: Video,
    PDF: FileText,
  };
  return icons[type] || FileText;
};

export default function SectionPage({ 
  params 
}: { 
  params: Promise<{ chapterId: string; sectionId: string }>
  }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [section, setSection] = useState<Section | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string>('Chapter');
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  const [isEditContentModalOpen, setIsEditContentModalOpen] = useState(false);

  useEffect(() => {
    loadSectionAndContent();
  }, [unwrappedParams.sectionId]);

  const loadSectionAndContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load section details
      const sectionData = await sectionsService.getById(unwrappedParams.sectionId);
      setSection(sectionData);

      // Load chapter title
      if (sectionData.chapterId) {
        try {
          const { chaptersService } = await import('@/lib/chapters');
          const chapterData = await chaptersService.getById(sectionData.chapterId);
          setChapterTitle(chapterData.title);
        } catch (err) {
          console.error('Error loading chapter:', err);
        }
      }

      // Load content for this section
      const contentData = await contentService.getAllBySection(unwrappedParams.sectionId);
      setContents(contentData);
    } catch (err) {
      console.error('Error loading section and content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  

  const handleContentAdded = () => {
    loadSectionAndContent();
    setIsAddContentModalOpen(false);
  };

  const handleContentUpdated = () => {
    loadSectionAndContent();
    setIsEditContentModalOpen(false);
    setSelectedContent(null);
  };

  const handleContentClick = (content: Content) => {
    setSelectedContent(content);
  };

  const handleEditContent = (content: Content) => {
    setSelectedContent(content);
    setIsEditContentModalOpen(true);
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      await contentService.delete(contentId);
      await loadSectionAndContent();
      if (selectedContent?.id === contentId) {
        setSelectedContent(null);
      }
    } catch (err) {
      console.error('Error deleting content:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete content');
    }
  };

  const handleDeleteSection = async () => {
    if (!section) return;

    // Confirmación con advertencia sobre el contenido
    const confirmMessage = contents.length > 0
      ? `Are you sure you want to delete "${section.title}"?\n\nThis section contains ${contents.length} content item${contents.length === 1 ? '' : 's'} that will also be deleted. This action cannot be undone.`
      : `Are you sure you want to delete "${section.title}"?\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await sectionsService.delete(unwrappedParams.sectionId);
      // Redirigir al capítulo después de eliminar
      router.push(`/dashboard/manuals/${unwrappedParams.chapterId}`);
    } catch (err) {
      console.error('Error deleting section:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete section');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Loading section...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">Error loading section</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
          <Button onClick={loadSectionAndContent} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Section not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm">
        <Link href="/dashboard/manuals" className="text-gray-600 hover:text-gray-900">
          Chapters
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <Link 
          href={`/dashboard/manuals/${unwrappedParams.chapterId}`} 
          className="text-gray-600 hover:text-gray-900"
        >
          {chapterTitle}
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-900">{section.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
          {section.description && (
            <p className="text-gray-600 mt-1">{section.description}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            {contents.length} content {contents.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href={`/dashboard/manuals/${unwrappedParams.chapterId}/sections/${unwrappedParams.sectionId}/edit`} className="text-blue-600 hover:underline mt-2 inline-block">
         
          <Button 
            variant="secondary"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Section
            </Button>
            
          </Link>
          
          <Button 
            variant="secondary"
            onClick={handleDeleteSection}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Section
          </Button>
          
          <Button onClick={() => setIsAddContentModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Content Items */}
      {contents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">No content yet</h3>
            <p className="text-gray-500 text-sm mb-4">
              Get started by adding your first content item
            </p>
            <Button onClick={() => setIsAddContentModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contents.map((content) => {
            const Icon = getContentIcon(content.type);
            const isSelected = selectedContent?.id === content.id;
            
            return (
              <div
                key={content.id}
                onClick={() => handleContentClick(content)}
                className="cursor-pointer"
              >
                <Card 
                  className={`hover:shadow-md transition-all ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 mb-1 truncate">
                            {content.title}
                          </h3>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-gray-500 uppercase">
                              {content.type}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              Order {content.order}
                            </span>
                            {!content.active && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-amber-600">Inactive</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditContent(content);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContent(content.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Content Preview */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Content Preview</h3>
          {selectedContent ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {selectedContent.title}
                  </h4>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-sm text-gray-500 uppercase">
                      {selectedContent.type}
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-500">
                      Order {selectedContent.order}
                    </span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEditContent(selectedContent)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                {selectedContent.type === 'TEXT' ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedContent.content }}
                  />
                ) : selectedContent.type === 'IMAGE' ? (
                  <div className="text-center">
                    <img 
                      src={selectedContent.content} 
                      alt={selectedContent.title}
                      className="max-w-full h-auto rounded-lg mx-auto"
                    />
                  </div>
                ) : selectedContent.type === 'VIDEO' ? (
                  <div className="aspect-video">
                    <video 
                      src={selectedContent.content}
                      controls
                      className="w-full h-full rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">PDF: {selectedContent.content}</p>
                  </div>
                )}
              </div>

              {selectedContent.metadata && Object.keys(selectedContent.metadata).length > 0 && (
                <div className="text-xs text-gray-500">
                  <strong>Metadata:</strong> {JSON.stringify(selectedContent.metadata)}
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Select a content item to preview</p>
              <p className="text-sm text-gray-500 mt-1">
                Click on any content card above
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      

      {isAddContentModalOpen && (
        <AddContentModal
          sectionId={unwrappedParams.sectionId}
          onClose={() => setIsAddContentModalOpen(false)}
          onSuccess={handleContentAdded}
        />
      )}

      {isEditContentModalOpen && selectedContent && (
        <EditContentModal
          content={selectedContent}
          onClose={() => {
            setIsEditContentModalOpen(false);
            setSelectedContent(null);
          }}
          onSuccess={handleContentUpdated}
        />
      )}
    </div>
  );
}