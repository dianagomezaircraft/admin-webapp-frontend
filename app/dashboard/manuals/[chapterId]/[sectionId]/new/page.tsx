'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { sectionsService } from '@/lib/sections';

export default function NewSectionPage({ 
  params 
}: { 
  params: Promise<{ chapterId: string }> 
}) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 1,
    active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await sectionsService.create({
        title: formData.title,
        description: formData.description || undefined,
        chapterId: unwrappedParams.chapterId,
        order: formData.order,
        active: formData.active,
      });

      // Redirect to chapter page on success
      router.push(`/dashboard/manuals/${unwrappedParams.chapterId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create section');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 1 : value,
    }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link 
        href={`/dashboard/manuals/${unwrappedParams.chapterId}`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Chapter
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">New Section</h2>
        <p className="text-gray-600 mt-1">Add a new section to this chapter</p>
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
              placeholder="e.g., Pre-Flight Safety Check"
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
                placeholder="Brief description of this section (optional)..."
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Optional - provide additional context for this section</p>
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
            //   helperText="The position of this section in the chapter"
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
              <label htmlFor="active" className="ml-2 text-sm font-medium text-gray-700">
                Active
              </label>
              <span className="ml-2 text-xs text-gray-500">
                (Inactive sections won&apos;t be visible to users)
              </span>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Section'}
              </Button>
              <Link href={`/dashboard/manuals/${unwrappedParams.chapterId}`}>
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