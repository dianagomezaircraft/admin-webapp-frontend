'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { chaptersService } from '@/lib/chapters';

export default function NewChapterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 1,
    isActive: true,
    airlineId: '', // Lo dejaremos vacío, el backend lo asignará automáticamente
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Si el backend asigna automáticamente el airlineId basado en el token,
      // solo enviamos name e isActive
      await chaptersService.create({
        name: formData.name,
        airlineId: formData.airlineId || '', // El backend lo obtendrá del token del usuario
        isActive: formData.isActive,
      });

      // Redirect to chapters list on success
      router.push('/dashboard/manuals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chapter');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value,
    }));
  };

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

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Chapter Title"
              name="name"
              value={formData.name}
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
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Chapter'}
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