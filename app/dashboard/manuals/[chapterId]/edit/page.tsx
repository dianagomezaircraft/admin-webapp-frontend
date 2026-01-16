'use client';

import { ArrowLeft, Loader2, AlertCircle, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { use, useEffect, useState } from 'react';
import { chaptersService, Chapter } from '@/lib/chapters';

export default function EditChapterPage({ 
  params 
}: { 
  params: Promise<{ chapterId: string }> 
}) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    active: true,
  });

  useEffect(() => {
    loadChapter();
  }, [unwrappedParams.chapterId]);

  const loadChapter = async () => {
    try {
      setLoading(true);
      setError(null);

      const chapterData = await chaptersService.getById(unwrappedParams.chapterId);
      
      setChapter(chapterData);
      setFormData({
        title: chapterData.title,
        description: chapterData.description || '',
        order: chapterData.order,
        active: chapterData.active,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chapter';
      setError(errorMessage);
      console.error('Error loading chapter:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Validate form data
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      if (formData.order < 0) {
        throw new Error('Order must be a positive number');
      }

      // Prepare update data
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        order: formData.order,
        active: formData.active,
      };

      // Call the API
      await chaptersService.update(unwrappedParams.chapterId, updateData);
      
      // Show success message
      setSuccessMessage('Chapter updated successfully!');
      
      // Redirect back to chapter page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/manuals/${unwrappedParams.chapterId}`);
      }, 1500);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update chapter';
      setError(errorMessage);
      console.error('Error updating chapter:', err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    router.push(`/dashboard/manuals/${unwrappedParams.chapterId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !chapter) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Error loading chapter</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <div className="mt-4 flex space-x-3">
              <Button onClick={loadChapter}>Try Again</Button>
              <Button variant="secondary" onClick={() => router.push('/dashboard/manuals')}>
                Back to Chapters
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href={`/dashboard/manuals/${unwrappedParams.chapterId}`}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Chapter</h1>
            <p className="text-gray-600 mt-1">Update chapter information</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-green-900 font-medium">{successMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter chapter title"
                disabled={saving}
                required
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter chapter description (optional)"
                rows={4}
                disabled={saving}
              />
            </div>

            {/* Order Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => handleChange('order', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter order number"
                min="0"
                disabled={saving}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Lower numbers appear first in the list
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={saving}
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Active
              </label>
              <p className="text-sm text-gray-500">
                Inactive chapters are hidden from users
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Chapter Information */}
      {chapter && (
        <Card className="bg-gray-50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Chapter Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Chapter ID:</span>
                <p className="text-gray-900 font-mono mt-1">{chapter.id}</p>
              </div>
              <div>
                <span className="text-gray-500">Airline ID:</span>
                <p className="text-gray-900 font-mono mt-1">{chapter.airlineId}</p>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <p className="text-gray-900 mt-1">
                  {new Date(chapter.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Last Updated:</span>
                <p className="text-gray-900 mt-1">
                  {new Date(chapter.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}