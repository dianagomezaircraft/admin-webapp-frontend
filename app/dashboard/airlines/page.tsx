'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { airlinesService, type Airline } from '@/lib/airlines';

export default function AirlinesPage() {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadAirlines();
  }, []);

  const loadAirlines = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await airlinesService.getAll();
      setAirlines(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load airlines');
      console.error('Error loading airlines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this airline?')) {
      return;
    }

    try {
      setDeletingId(id);
      await airlinesService.delete(id);
      setAirlines(airlines.filter(airline => airline.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete airline');
      console.error('Error deleting airline:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading airlines...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Airlines</h2>
            <p className="text-gray-600 mt-1">Manage airline tenants</p>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-800 mb-4">{error}</p>
            <Button onClick={loadAirlines} variant="secondary">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Airlines</h2>
          <p className="text-gray-600 mt-1">Manage airline tenants</p>
        </div>
        <Link href="/dashboard/airlines/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Airline
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {airlines.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 mb-4">No airlines found</p>
            <Link href="/dashboard/airlines/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Airline
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Airlines Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {airlines.map((airline) => (
            <Card key={airline.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${airline.branding.primaryColor}20` }}
                    >
                      {airline.logo ? (
                        <img 
                          src={airline.logo} 
                          alt={airline.name} 
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <span 
                          className="text-lg font-bold"
                          style={{ color: airline.branding.primaryColor }}
                        >
                          {airline.code}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{airline.name}</h3>
                      <p className="text-sm text-gray-500">{airline.code}</p>
                    </div>
                  </div>
                  <Badge variant={airline.active ? 'green' : 'gray'}>
                    {airline.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Users</span>
                    <span className="font-medium text-gray-900">
                      {airline._count.users}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Manuals</span>
                    <span className="font-medium text-gray-900">
                      {airline._count.manualChapters}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link href={`/dashboard/airlines/${airline.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleDelete(airline.id)}
                    disabled={deletingId === airline.id}
                  >
                    {deletingId === airline.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}