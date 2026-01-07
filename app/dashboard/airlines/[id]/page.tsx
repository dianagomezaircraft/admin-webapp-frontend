'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { airlinesService, type Airline } from '@/lib/airlines';

export default function EditAirlinePage({ params }: { params: { id: string } }) {
  const [airline, setAirline] = useState<Airline>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    loadAirline();
  }, []);

  const loadAirline = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await airlinesService.getById(params.id);
      setAirline(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load airline');
      console.error('Error loading airline:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/airlines" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Airlines
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Edit Airline</h2>
        <p className="text-gray-600 mt-1">Update airline information</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Airline Name"
                defaultValue="American Airlines"
                required
              />
              <Input
                label="Code"
                defaultValue="AA"
                maxLength={3}
                required
              />
            </div>

            <Input
              label="Logo URL"
              defaultValue="https://example.com/aa-logo.png"
              type="url"
            />

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Branding Colors
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Primary Color</label>
                  <div className="flex items-center space-x-2">
                    <input type="color" className="w-12 h-10 rounded cursor-pointer" defaultValue="#0078D2" />
                    <Input defaultValue="#0078D2" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Secondary Color</label>
                  <div className="flex items-center space-x-2">
                    <input type="color" className="w-12 h-10 rounded cursor-pointer" defaultValue="#C8102E" />
                    <Input defaultValue="#C8102E" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="active" defaultChecked className="rounded border-gray-300" />
              <label htmlFor="active" className="text-sm text-gray-700">Active</label>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="ghost">Cancel</Button>
              <Button type="button" variant="danger" className="ml-auto">Delete Airline</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}