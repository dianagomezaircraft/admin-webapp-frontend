'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { chaptersService } from '@/lib/chapters';
import { airlinesService, type Airline } from '@/lib/airlines';
import { storageService } from '@/lib/storage';
import Image from 'next/image';

export default function NewChapterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAirlines, setIsLoadingAirlines] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 1,
    active: true,
    airlineId: '', 
  });

  useEffect(() => {
    loadAirlines();
  }, []);

  const loadAirlines = async () => {
    try {
      setIsLoadingAirlines(true);
      setError(null);
      const data = await airlinesService.getAll();
      setAirlines(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load airlines');
      console.error('Error loading airlines:', err);
    } finally {
      setIsLoadingAirlines(false);
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
    const maxSize = 5 * 1024 * 1024; // 5MB
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

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.airlineId) {
      setError('Please select an airline');
      return;
    }

    setIsLoading(true);

    try {
      // Create chapter first to get the ID
      const newChapter = await chaptersService.create({
        title: formData.title,
        description: formData.description,
        airlineId: formData.airlineId,
        active: formData.active,
      });

      // Upload image if selected
      let imageUrl = null;
      if (imageFile && newChapter.id) {
        setIsUploadingImage(true);
        imageUrl = await storageService.uploadChapterImage(imageFile, newChapter.id);
        
        // Update chapter with image URL
        await chaptersService.update(newChapter.id, {
          ...newChapter,
          imageUrl,
        });
      }

      router.push('/dashboard/manuals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chapter');
    } finally {
      setIsLoading(false);
      setIsUploadingImage(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value,
    }));
  };

  if (isLoadingAirlines) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Loading airlines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/manuals" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Chapters
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">New Chapter</h2>
        <p className="text-gray-600 mt-1">Create a new manual chapter</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {airlines.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded">
          No active airlines found. Please create an airline first.
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Airline <span className="text-red-500">*</span>
              </label>
              <select
                name="airlineId"
                value={formData.airlineId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
                disabled={isLoading || airlines.length === 0}
              >
                <option value="">Select an airline</option>
                {airlines.map((airline) => (
                  <option key={airline.id} value={airline.id}>
                    {airline.name} ({airline.code})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Chapter Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Safety Procedures"
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
                placeholder="Brief description of this chapter..."
                disabled={isLoading}
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
                <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                  </button>
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

            <div className="flex space-x-3 pt-4">
              <Button type="submit" disabled={isLoading || airlines.length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isUploadingImage ? 'Uploading image...' : 'Creating...'}
                  </>
                ) : (
                  'Create Chapter'
                )}
              </Button>
              <Link href="/dashboard/manuals">
                <Button type="button" variant="ghost" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}