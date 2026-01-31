// app/dashboard/contacts/groups/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { contactsService, ContactGroup } from '@/lib/contacts';
import { authService } from '@/lib/auth';
import { User } from '@/lib/users';

export default function EditContactGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<ContactGroup | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
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

    loadGroupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const loadGroupData = async () => {
    setIsLoadingData(true);
    setError(null);

    try {
      const groupData = await contactsService.getGroupById(groupId);
      setGroup(groupData);
      setFormData({
        name: groupData.name,
        description: groupData.description || '',
        order: groupData.order.toString(),
        active: groupData.active,
      });
    } catch (err) {
      console.error('Error loading group:', err);
      setError(err instanceof Error ? err.message : 'Failed to load group');
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

      await contactsService.updateGroup(groupId, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        order: parseInt(formData.order,10),
        active: formData.active,
      });

      router.push('/dashboard/contacts');
    } catch (err) {
      console.error('Error updating contact group:', err);
      setError(err instanceof Error ? err.message : 'Failed to update contact group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await contactsService.deleteGroup(groupId);
      router.push('/dashboard/contacts');
    } catch (err) {
      console.error('Error deleting contact group:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete contact group');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
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

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Group not found</p>
          <Link href="/dashboard/contacts">
            <Button variant="secondary" className="mt-4">
              Back to Contacts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
            <h2 className="text-2xl font-bold text-gray-900">Edit Contact Group</h2>
            <p className="text-gray-600 mt-1">Update group information</p>
          </div>
        </div>

        {/* Delete Button */}
        {(user?.role === 'EDITOR' || user?.role === 'SUPER_ADMIN') && (
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Group
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

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <p className="font-semibold text-red-900">Delete Contact Group?</p>
                <p className="text-red-800 mt-1">
                  This action cannot be undone. This will permanently delete the contact group
                  {group.contacts && group.contacts.length > 0 && (
                    <span className="font-semibold"> and all {group.contacts.length} contact(s) in it</span>
                  )}.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </div>
            </div>
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
            {/* Airline Info (Read-only) */}
            {group.airline && (
              <div className="pb-6 border-b">
                <Label>Airline</Label>
                <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-gray-900 font-medium">
                    {group.airline.name} ({group.airline.code})
                  </p>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Airline cannot be changed after creation
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

            {/* Group Stats */}
            {group.contacts && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Contacts</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{group.contacts.length}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Active Contacts</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {group.contacts.filter(c => c.active).length}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium">Inactive Contacts</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {group.contacts.filter(c => !c.active).length}
                    </p>
                  </div>
                </div>
              </div>
            )}

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