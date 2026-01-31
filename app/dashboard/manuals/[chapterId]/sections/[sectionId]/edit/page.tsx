'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Upload, X, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { sectionsService, Section } from '@/lib/sections';
import { storageService } from '@/lib/storage';
import Image from 'next/image';

export default function EditSectionPage() {
  const router = useRouter();
  const params = useParams();
  const chapterId = params.chapterId as string;
  const sectionId = params.sectionId as string;

  const [section, setSection] = useState<Section | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSection, setIsLoadingSection] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 1,
    active: true,
  });

  useEffect(() => {
    loadSection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  const loadSection = async () => {
    try {
      setIsLoadingSection(true);
      setError(null);
      const data = await sectionsService.getById(sectionId);
      setSection(data);
      
      // Set form data
      setFormData({
        title: data.title,
        description: data.description || '',
        order: data.order,
        active: data.active,
      });

      // Set current image if exists
      if (data.imageUrl) {
        setCurrentImageUrl(data.imageUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load section');
      console.error('Error loading section:', err);
    } finally {
      setIsLoadingSection(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file using storage service
    const validationError = storageService.validateImageFile(file);
    if (validationError) {
      setError(validationError);
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

  const handleRemoveNewImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleDeleteCurrentImage = async () => {
    if (!currentImageUrl) return;

    if (!confirm('Are you sure you want to delete the current image?')) {
      return;
    }

    setIsDeletingImage(true);
    setError(null);

    try {
      // Delete image from storage
      await storageService.deleteSectionImage(currentImageUrl);

      // Update section to remove image URL
      await sectionsService.update(sectionId, {
        imageUrl: null,
      });

      setCurrentImageUrl(null);
      alert('Image deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
      console.error('Error deleting image:', err);
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description || null,
        order: formData.order,
        active: formData.active,
      };

      // Upload new image if selected
      if (imageFile) {
        setIsUploadingImage(true);
        
        // Delete old image if exists
        if (currentImageUrl) {
          try {
            await storageService.deleteSectionImage(currentImageUrl);
          } catch (err) {
            console.warn('Failed to delete old image:', err);
          }
        }

        // Upload new image
        const imageUrl = await storageService.uploadSectionImage(imageFile, sectionId);
        updateData.imageUrl = imageUrl;
      }

      // Update section
      await sectionsService.update(sectionId, updateData);

      router.push(`/dashboard/manuals/${chapterId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update section');
    } finally {
      setIsLoading(false);
      setIsUploadingImage(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value,
    }));
  };

  if (isLoadingSection) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Loading section...</p>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="max-w-2xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-800">Section not found</p>
            <Link href="/dashboard/manuals" className="text-blue-600 hover:underline mt-2 inline-block">
              Back to Chapters
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link 
        href={`/dashboard/manuals/${chapterId}`} 
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Chapter
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Edit Section</h2>
        <p className="text-gray-600 mt-1">
          Update section details and image
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Section Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Emergency Procedures"
              required
              disabled={isLoading}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows={4}
                placeholder="Brief description of this section..."
                disabled={isLoading}
              />
            </div>

            {/* Current Image Section */}
            {currentImageUrl && !imagePreview && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Image
                </label>
                <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                  <Image
                    src={currentImageUrl}
                    alt={section.title}
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleDeleteCurrentImage}
                    disabled={isDeletingImage || isLoading}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors disabled:bg-gray-400"
                  >
                    {isDeletingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Upload a new image below to replace this one
                </p>
              </div>
            )}

            {/* New Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentImageUrl && !imagePreview ? 'Upload New Image' : 'Section Image'}
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    disabled={isLoading}
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
                <div>
                  <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="New preview"
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveNewImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ This will replace the current image when you save
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Order"
              name="order"
              type="number"
              value={formData.order}
              onChange={handleChange}
              min="1"
              required
              disabled={isLoading}
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="active" className="ml-2 text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <Link href={`/dashboard/manuals/${chapterId}`} className="flex-1">
                <Button type="button" variant="secondary" disabled={isLoading} className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isUploadingImage ? 'Uploading image...' : 'Updating...'}
                  </>
                ) : (
                  'Update Section'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}