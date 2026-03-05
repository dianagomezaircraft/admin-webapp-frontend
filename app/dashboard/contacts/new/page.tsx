// app/dashboard/contacts/new/page.tsx
'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Upload, X } from 'lucide-react'; // Añadido Upload y X
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { contactsService, ContactGroup } from '@/lib/contacts';
import { authService, User } from '@/lib/auth';
import { storageService } from '@/lib/storage'; // Importar storageService
import Image from 'next/image'; // Importar Image

interface Airline {
  id: string;
  name: string;
  code: string;
}

function CreateContactForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedGroupId = searchParams.get('groupId');

  const [user, setUser] = useState<User | null>(null);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false); // Nuevo estado
  const [error, setError] = useState<string | null>(null);

  // Nuevos estados para el avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    phone: '',
    email: '',
    timezone: '',
    avatar: '', // Este campo ahora contendrá la URL de Supabase
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

  // ... (mantener los useEffect y loadInitialData sin cambios)
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

  /**
   * Maneja la selección del archivo de avatar
   */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    setError(null);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Remueve el avatar seleccionado
   */
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setFormData(prev => ({ ...prev, avatar: '' }));
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

      // Preparar datos del contacto
      const contactData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        title: formData.title.trim() || undefined,
        company: formData.company.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        timezone: formData.timezone.trim() || undefined,
        avatar: formData.avatar.trim() || undefined, // Se actualizará si hay archivo
        active: formData.active,
        order: parseInt(formData.order, 10),
        metadata: Object.keys(metadataObj).length > 0 ? metadataObj : undefined,
      };

      // Crear el contacto primero
      const newContact = await contactsService.create(formData.groupId, contactData);

      // Subir avatar si fue seleccionado
      if (avatarFile && newContact.id) {
        setIsUploadingAvatar(true);
        
        // Necesitarás crear esta función en tu storageService
        const avatarUrl = await storageService.uploadContactAvatar(avatarFile, newContact.id);
        
        // Actualizar el contacto con la URL del avatar
        await contactsService.update(newContact.id, {
          avatar: avatarUrl,
        });
        // await contactsService.update(formData.groupId, newContact.id, {
        //   avatar: avatarUrl,
        // });
      }

      router.push('/dashboard/contacts');
    } catch (err) {
      console.error('Error creating contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to create contact');
    } finally {
      setIsSaving(false);
      setIsUploadingAvatar(false);
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

                {/* REEMPLAZAR el campo de Avatar URL con upload de imagen */}
                <div>
                  <Label>Avatar Photo</Label>
                  
                  {!avatarPreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleAvatarChange}
                        className="hidden"
                        id="avatar-upload"
                        disabled={isSaving}
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          Click to upload
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          PNG, JPG, WebP (max. 5MB)
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
                      <div className="flex items-center justify-center p-4 bg-gray-50">
                        <Image
                          src={avatarPreview}
                          alt="Avatar Preview"
                          width={120}
                          height={120}
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        disabled={isSaving}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Upload a profile photo
                  </p>
                </div>
              </div>
            </div>

            {/* ... resto del formulario sin cambios ... */}
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
                    {isUploadingAvatar ? 'Uploading avatar...' : 'Creating...'}
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