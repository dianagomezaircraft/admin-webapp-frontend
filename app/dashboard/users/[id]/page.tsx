'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { usersService, type User } from '@/lib/users';
import { airlinesService, type Airline } from '@/lib/airlines';

interface EditUserPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'VIEWER' as 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER',
    airlineId: '',
    active: true,
    password: '', // Optional - only set if changing password
  });

  const [originalData, setOriginalData] = useState<User | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [userData, airlinesData] = await Promise.all([
        usersService.getById(id),
        airlinesService.getAll(),
      ]);

      if (!userData) {
        setError('User not found');
        return;
      }

      setOriginalData(userData);
      setAirlines(airlinesData);
      
      setFormData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        airlineId: userData.airlineId || '',
        active: userData.active,
        password: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.role) {
      setError('Role is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password validation (only if changing)
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Prepare update data
      const updateData: Record<string, string | boolean | null> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        role: formData.role,
        airlineId: formData.airlineId || null,
        active: formData.active,
      };

      // Only include password if it's being changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      await usersService.update(id, updateData);
      
      // Redirect to users list
      router.push('/dashboard/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      console.error('Error updating user:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (error && !formData.firstName) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-800 mb-4">{error}</p>
            <Button onClick={loadData} variant="secondary">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
            <p className="text-gray-600 mt-1">Update user information and permissions</p>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      {originalData && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xl font-medium text-gray-700">
                  {originalData.firstName[0]}{originalData.lastName[0]}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {originalData.firstName} {originalData.lastName}
                </h3>
                <p className="text-sm text-gray-600">{originalData.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={originalData.active ? 'green' : 'gray'}>
                    {originalData.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="blue">{originalData.role}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password <span className="text-gray-500 text-xs">(leave blank to keep current)</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter new password (optional)"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 6 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Role & Permissions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Role & Permissions
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.role === 'SUPER_ADMIN' && 'Full system access'}
                    {formData.role === 'ADMIN' && 'Manage users and settings'}
                    {formData.role === 'EDITOR' && 'Edit content'}
                    {formData.role === 'VIEWER' && 'View-only access'}
                  </p>
                </div>

                <div>
                  <label htmlFor="airline" className="block text-sm font-medium text-gray-700 mb-2">
                    Airline
                  </label>
                  <select
                    id="airline"
                    value={formData.airlineId}
                    onChange={(e) => handleInputChange('airlineId', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Airline (Admin User)</option>
                    {airlines.map((airline) => (
                      <option key={airline.id} value={airline.id}>
                        {airline.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for admin users
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Status
              </h3>
              <label htmlFor="active" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="active"
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Active Account</span>
                  <p className="text-xs text-gray-500">
                    Inactive users cannot log in to the system
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href="/dashboard/users">
                <Button type="button" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? (
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

      {/* Metadata */}
      {originalData && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Created</p>
                <p className="text-gray-900 font-medium">
                  {originalData.createdAt ? new Date(originalData.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="text-gray-900 font-medium">
                  {originalData.updatedAt
                    ? new Date(originalData.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last Login</p>
                <p className="text-gray-900 font-medium">
                  {originalData.lastLogin
                    ? new Date(originalData.lastLogin).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">User ID</p>
                <p className="text-gray-900 font-mono text-xs">{originalData.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}