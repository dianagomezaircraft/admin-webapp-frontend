// app/dashboard/contacts/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { contactsService, Contact } from '@/lib/contacts';
import { authService, User } from '@/lib/auth';

interface ContactMetadata {
  office_tel?: string;
  officeTel?: string;
  home_tel?: string;
  homeTel?: string;
  alternate_mobile?: string;
  alternateMobile?: string;
  uk_mobile?: string;
  ukMobile?: string;
  [key: string]: string | undefined;
}

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    active: true,
    order: 0,
  });

  const [metadata, setMetadata] = useState({
    officeTel: '',
    homeTel: '',
    alternateMobile: '',
    ukMobile: '',
  });

  useEffect(() => {
    // Get user from authService
    const currentUser = authService.getUser();
    setUser(currentUser);
    
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    loadContact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  const loadContact = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await contactsService.getById(contactId);
      setContact(data);
      
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        title: data.title || '',
        company: data.company || '',
        phone: data.phone || '',
        email: data.email || '',
        timezone: data.timezone || '',
        avatar: data.avatar || '',
        active: data.active,
        order: data.order,
      });

      // Parse metadata
      if (data.metadata) {
        const contactMetadata = data.metadata as ContactMetadata;
        setMetadata({
          officeTel: contactMetadata.office_tel || contactMetadata.officeTel || '',
          homeTel: contactMetadata.home_tel || contactMetadata.homeTel || '',
          alternateMobile: contactMetadata.alternate_mobile || contactMetadata.alternateMobile || '',
          ukMobile: contactMetadata.uk_mobile || contactMetadata.ukMobile || '',
        });
      }
    } catch (err) {
      console.error('Error loading contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contact');
    } finally {
      setIsLoading(false);
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
      // Prepare metadata object
      const metadataObj: Record<string, string> = {};
      if (metadata.officeTel) metadataObj.office_tel = metadata.officeTel;
      if (metadata.homeTel) metadataObj.home_tel = metadata.homeTel;
      if (metadata.alternateMobile) metadataObj.alternate_mobile = metadata.alternateMobile;
      if (metadata.ukMobile) metadataObj.uk_mobile = metadata.ukMobile;

      await contactsService.update(contactId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        title: formData.title || undefined,
        company: formData.company || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        timezone: formData.timezone || undefined,
        avatar: formData.avatar || undefined,
        active: formData.active,
        order: formData.order,
        metadata: Object.keys(metadataObj).length > 0 ? metadataObj : undefined,
      });

      router.push('/dashboard/contacts');
    } catch (err) {
      console.error('Error updating contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to update contact');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await contactsService.delete(contactId);
      router.push('/dashboard/contacts');
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete contact');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading contact...</p>
        </div>
      </div>
    );
  }

  if (error && !contact) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/contacts">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Edit Contact</h2>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user can delete (EDITOR or SUPER_ADMIN)
  const canDelete = user?.role === 'EDITOR' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/contacts">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Contact</h2>
            {contact && (
              <p className="text-gray-600 mt-1">
                {contact.group.name} • {contact.airline?.name || 'No airline'}
              </p>
            )}
          </div>
        </div>

        {/* Delete Button */}
        {canDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Contact
              </>
            )}
          </Button>
        )}
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
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Airline Information (Read-only) */}
            {contact?.airline && (
              <div className="pb-6 border-b bg-gray-50 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
                <Label>Airline</Label>
                <div className="mt-2 flex items-center space-x-2">
                  <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 font-medium">
                    {contact.airline.name} ({contact.airline.code})
                  </div>
                  <span className="text-sm text-gray-500">
                    (Cannot be changed)
                  </span>
                </div>
                {user?.role === 'SUPER_ADMIN' && (
                  <p className="text-sm text-amber-600 mt-2">
                    ⚠️ To change the airline, please delete this contact and create a new one.
                  </p>
                )}
              </div>
            )}

            {/* Group Information (Read-only) */}
            <div>
              <Label>Contact Group</Label>
              <div className="mt-2">
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                  {contact?.group.name}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  To move this contact to another group, delete and recreate it
                </p>
              </div>
            </div>

            {/* Basic Information */}
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

            {/* Contact Details */}
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

            {/* Additional Contact Information */}
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

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Link href="/dashboard/contacts">
                <Button type="button" variant="secondary" disabled={isSaving || isDeleting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSaving || isDeleting}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
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