// app/dashboard/contacts/new/page.tsx
'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { contactsService, ContactGroup } from '@/lib/contacts';
import { authService, User } from '@/lib/auth';

interface Airline {
  id: string;
  name: string;
  code: string;
}

function CreateContactForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedGroupId = searchParams.get('groupId');

  // ... rest of your component code stays exactly the same ...
  const [user, setUser] = useState<User | null>(null);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    phone: '',
    email: '',
    timezone: '',
    avatar: '',
    groupId: preselectedGroupId || '',
    airlineId: '',
    active: true,
    order: '0',
  });

  const [metadata, setMetadata] = useState({
    officeTel: '',
    homeTel: '',
    alternateMobile: '',
    ukMobile: '',
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
    console.log(currentUser);
    
    setIsLoadingData(true);
    setError(null);

    try {
      const groups = await contactsService.getAllGroups();
      setContactGroups(groups);

      if (currentUser?.role === 'SUPER_ADMIN') {
        const uniqueAirlines = Array.from(
          new Map(
            groups
              .filter(g => g.airline)
              .map(g => [g.airline.id, g.airline])
          ).values()
        );
        setAirlines(uniqueAirlines);
      } else {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (!formData.firstName.trim()) {
        throw new Error('First name is required');
      }
      if (!formData.lastName.trim()) {
        throw new Error('Last name is required');
      }
      if (!formData.groupId) {
        throw new Error('Contact group is required');
      }
      if (user?.role === 'SUPER_ADMIN' && !formData.airlineId) {
        throw new Error('Airline is required');
      }

      const metadataObj: Record<string, string> = {};
      if (metadata.officeTel) metadataObj.office_tel = metadata.officeTel;
      if (metadata.homeTel) metadataObj.home_tel = metadata.homeTel;
      if (metadata.alternateMobile) metadataObj.alternate_mobile = metadata.alternateMobile;
      if (metadata.ukMobile) metadataObj.uk_mobile = metadata.ukMobile;

      await contactsService.create(formData.groupId, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        title: formData.title.trim() || undefined,
        company: formData.company.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        timezone: formData.timezone.trim() || undefined,
        avatar: formData.avatar.trim() || undefined,
        active: formData.active,
        order: parseInt(formData.order, 10),
        metadata: Object.keys(metadataObj).length > 0 ? metadataObj : undefined,
      });

      router.push('/dashboard/contacts');
    } catch (err) {
      console.error('Error creating contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to create contact');
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

  const filteredGroups = formData.airlineId
    ? contactGroups.filter(g => g.airlineId === formData.airlineId)
    : contactGroups;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/contacts">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Contact</h2>
          <p className="text-gray-600 mt-1">Add a new contact to your directory</p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  Select the airline this contact belongs to
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="groupId">
                Contact Group <span className="text-red-500">*</span>
              </Label>
              <select
                id="groupId"
                name="groupId"
                value={formData.groupId}
                onChange={handleInputChange}
                required
                disabled={user?.role === 'SUPER_ADMIN' && !formData.airlineId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select a contact group</option>
                {filteredGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              {user?.role === 'SUPER_ADMIN' && !formData.airlineId && (
                <p className="text-sm text-amber-600 mt-1">
                  Please select an airline first
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Executive Director"
                />
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="e.g., McLarens Aviation"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone">Mobile Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    placeholder="e.g., GMT -5"
                  />
                </div>

                <div>
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input
                    id="avatar"
                    name="avatar"
                    type="url"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="officeTel">Office Telephone</Label>
                  <Input
                    id="officeTel"
                    name="officeTel"
                    type="tel"
                    value={metadata.officeTel}
                    onChange={handleMetadataChange}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div>
                  <Label htmlFor="homeTel">Home Telephone</Label>
                  <Input
                    id="homeTel"
                    name="homeTel"
                    type="tel"
                    value={metadata.homeTel}
                    onChange={handleMetadataChange}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div>
                  <Label htmlFor="alternateMobile">Alternate Mobile</Label>
                  <Input
                    id="alternateMobile"
                    name="alternateMobile"
                    type="tel"
                    value={metadata.alternateMobile}
                    onChange={handleMetadataChange}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div>
                  <Label htmlFor="ukMobile">UK Mobile</Label>
                  <Input
                    id="ukMobile"
                    name="ukMobile"
                    type="tel"
                    value={metadata.ukMobile}
                    onChange={handleMetadataChange}
                    placeholder="+44 1234 567890"
                  />
                </div>
              </div>
            </div>

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
                    Lower numbers appear first
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
                </div>
              </div>
            </div>

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
                    Create Contact
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

// Main export with Suspense wrapper
export default function CreateContactPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CreateContactForm />
    </Suspense>
  );
}