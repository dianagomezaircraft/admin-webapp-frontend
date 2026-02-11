// app/dashboard/contacts/groups/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { contactsService } from '@/lib/contacts';
import { airlinesService } from '@/lib/airlines';
import { authService, User } from '@/lib/auth';
// import { User } from '@/lib/users';

interface Airline {
  id: string;
  name: string;
  code: string;
}

export default function CreateContactGroupPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    airlineId: '',
    order: '0',
    active: true,
  });

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
    
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    loadInitialData(currentUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async (currentUser: User) => {
    setIsLoadingData(true);
    setError(null);

    try {
      // If user is SUPER_ADMIN, load all airlines
      if (currentUser?.role === 'SUPER_ADMIN') {
        const allAirlines = await airlinesService.getAll();
        setAirlines(allAirlines);
      } else {
        // For normal users, set their airlineId
        if (currentUser?.airlineId) {
          setFormData(prev => ({ ...prev, airlineId: currentUser.airlineId || '' }));
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Validations
      if (!formData.name.trim()) {
        throw new Error('Group name is required');
      }

      if (user?.role === 'SUPER_ADMIN' && !formData.airlineId) {
        throw new Error('Airline is required');
      }

      // CAMBIO PRINCIPAL: Pasar airlineId al servicio
      await contactsService.createGroup({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        order: parseInt(formData.order, 10),
        active: formData.active,
        airlineId: formData.airlineId || undefined, // ✅ AGREGADO: Pasar el airlineId
      });

      router.push('/dashboard/contacts');
    } catch (err) {
      console.error('Error creating contact group:', err);
      setError(err instanceof Error ? err.message : 'Failed to create contact group');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/contacts">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Contact Group</h2>
          <p className="text-gray-600 mt-1">Add a new group to organize your contacts</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Group Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Airline Selection (SUPER_ADMIN only) */}
            {user?.role === 'SUPER_ADMIN' && (
              <div className="pb-6 border-b">
                <Label htmlFor="airlineId">
                  Airline <span className="text-red-500">*</span>
                </Label>
                <select
                  id="airlineId"
                  name="airlineId"
                  value={formData.airlineId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an airline</option>
                  {airlines.map((airline) => (
                    <option key={airline.id} value={airline.id}>
                      {airline.name} ({airline.code})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Select the airline this group belongs to
                </p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">
                  Group Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Emergency Contacts"
                  maxLength={100}
                />
                <p className="text-sm text-gray-500 mt-1">
                  A clear, descriptive name for this contact group
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Optional description of this contact group"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Provide additional context about this group&apos;s purpose
                </p>
              </div>
            </div>

            {/* Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    name="order"
                    type="number"
                    value={formData.order}
                    onChange={handleInputChange}
                    min="0"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Lower numbers appear first in the list
                  </p>
                </div>

                <div>
                  <Label htmlFor="active">Status</Label>
                  <select
                    id="active"
                    name="active"
                    value={formData.active ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.value === 'true' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Inactive groups are hidden from users
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Link href="/dashboard/contacts">
                <Button type="button" variant="secondary" disabled={isSaving}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Group
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}