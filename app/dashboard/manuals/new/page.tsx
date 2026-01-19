'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { chaptersService } from '@/lib/chapters';
import { airlinesService, type Airline } from '@/lib/airlines';

export default function NewChapterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAirlines, setIsLoadingAirlines] = useState(true);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 1,
    active: true,
    airlineId: '', 
  });

  // Fetch airlines on component mount
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
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.airlineId) {
      setError('Please select an airline');
      return;
    }

    setIsLoading(true);

    try {
      await chaptersService.create({
        title: formData.title,
        airlineId: formData.airlineId,
        active: formData.active,
      });

      router.push('/dashboard/manuals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chapter');
    } finally {
      setIsLoading(false);
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