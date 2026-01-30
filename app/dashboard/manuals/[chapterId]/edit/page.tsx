'use client';

import { ArrowLeft, Loader2, AlertCircle, Save, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { use, useEffect, useState } from 'react';
import { chaptersService, Chapter } from '@/lib/chapters';
import { storageService } from '@/lib/storage';
import Image from 'next/image';

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    active: true,
    currentImageUrl: '',
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
        currentImageUrl: chapterData.imageUrl || '',
      });
      
      // Set current image as preview if exists
      if (chapterData.imageUrl) {
        setImagePreview(chapterData.imageUrl);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chapter';
      setError(errorMessage);
      console.error('Error loading chapter:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async () => {
    if (formData.currentImageUrl && window.confirm('Are you sure you want to remove the current image?')) {
      try {
        // Delete from Supabase
        await storageService.deleteChapterImage(formData.currentImageUrl);
        
        // Update chapter to remove imageUrl
        await chaptersService.update(unwrappedParams.chapterId, {
          imageUrl: null as any,
        });
        
        setFormData(prev => ({ ...prev, currentImageUrl: '' }));
        setImagePreview(null);
        setImageFile(null);
        setSuccessMessage('Image removed successfully');
        
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        setError('Failed to remove image');
        console.error('Error removing image:', err);
      }
    } else if (!formData.currentImageUrl) {
      // Just clear the preview if it's a new upload
      setImageFile(null);
      setImagePreview(null);
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

      // Upload new image if selected
      let imageUrl = formData.currentImageUrl;
      if (imageFile) {
        setIsUploadingImage(true);
        
        // Delete old image if exists
        if (formData.currentImageUrl) {
          await storageService.deleteChapterImage(formData.currentImageUrl);
        }
        
        // Upload new image
        imageUrl = await storageService.uploadChapterImage(imageFile, unwrappedParams.chapterId);
        setIsUploadingImage(false);
      }

      // Prepare update data
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        order: formData.order,
        active: formData.active,
        imageUrl: imageUrl || undefined,
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
      setIsUploadingImage(false);
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

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter Image
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    disabled={saving}
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG or WebP (max. 5MB)
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Chapter preview"
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {imageFile && (
                    <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
                      New image selected
                    </div>
                  )}
                </div>
              )}
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
                    {isUploadingImage ? 'Uploading image...' : 'Saving...'}
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