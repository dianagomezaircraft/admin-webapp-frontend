// app/dashboard/templates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { FileCode, Loader2, GitFork, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { templatesService, type TemplateChapter } from '@/lib/templates';
import { chaptersService, type Airline } from '@/lib/chapters';
import { authService, type User } from '@/lib/auth';
import { ForkTemplateModal } from '@/components/templates/ForkTemplateModal';

export default function TemplatesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<TemplateChapter[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateChapter | null>(null);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
    
    if (!currentUser) {
      window.location.href = '/auth/login';
      return;
    }

    loadData(currentUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async (currentUser: User) => {
    try {
      setIsLoading(true);
      setError(null);

      // Load templates
      const templatesData = await templatesService.getAllTemplates();
      setTemplates(templatesData);

      // Load airlines if SUPER_ADMIN
      if (currentUser.role === 'SUPER_ADMIN') {
        const airlinesData = await chaptersService.getAirlines();
        setAirlines(airlinesData.filter(a => a.active));
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForkSuccess = () => {
    setSelectedTemplate(null);
    if (user) {
      loadData(user);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Available Templates</h2>
          <p className="text-gray-600 mt-1">
            Browse and fork templates to quickly set up manuals
          </p>
        </div>
        <Link href="/dashboard/manuals">
          <Button variant="secondary">
            Back to Manuals
          </Button>
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading templates...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && templates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileCode className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates available</h3>
            <p className="text-gray-600">
              Templates will appear here once they are created
            </p>
          </CardContent>
        </Card>
      )}

      {/* Templates Grid */}
      {!isLoading && templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {/* Template Image */}
                {template.imageUrl ? (
                  <div className="relative w-full h-40 bg-gray-100">
                    <Image
                      src={template.imageUrl}
                      alt={template.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <FileCode className="w-12 h-12 text-white opacity-50" />
                  </div>
                )}

                {/* Template Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                      {template.title}
                    </h3>
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded flex-shrink-0">
                      Template
                    </span>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {template.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Source:</span>
                      <span className="font-medium text-gray-900">
                        {template.airline.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sections:</span>
                      <span className="font-medium text-gray-900">
                        {template._count?.sections || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Forks:</span>
                      <span className="font-medium text-gray-900">
                        {template._count?.forkedChapters || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Version:</span>
                      <span className="font-medium text-gray-900">
                        v{template.templateVersion}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Updated:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(template.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setSelectedTemplate(template)}
                    className="w-full"
                    size="sm"
                  >
                    <GitFork className="w-4 h-4 mr-2" />
                    Fork Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Fork Modal */}
      {selectedTemplate && (
        <ForkTemplateModal
          template={selectedTemplate}
          airlines={user?.role === 'SUPER_ADMIN' ? airlines : undefined}
          onClose={() => setSelectedTemplate(null)}
          onSuccess={handleForkSuccess}
        />
      )}
    </div>
  );
}