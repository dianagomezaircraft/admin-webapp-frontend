'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import { usersService } from '@/lib/users';
import { airlinesService, Airline } from '@/lib/airlines';

export default function NewUserPage() {
  const router = useRouter();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'VIEWER',
    airlineId: '',
    active: true,
  });
  
  // Estados de control
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [loadingAirlines, setLoadingAirlines] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * Cargar aerolíneas activas cuando el componente se monta
   */
  useEffect(() => {
    loadAirlines();
  }, []);

  /*
   * Obtiene la lista de aerolíneas activas para el selector
   */
  async function loadAirlines() {
    try {
      setLoadingAirlines(true);
      const data = await airlinesService.getAll();
      
      // Filtrar solo aerolíneas activas
      const activeAirlines = data.filter(airline => airline.active);
      setAirlines(activeAirlines);
      
    } catch (err) {
      console.error('Error loading airlines:', err);
      setError('Failed to load airlines. Please refresh the page.');
    } finally {
      setLoadingAirlines(false);
    }
  }

  /*
   * Maneja los cambios en los inputs del formulario
   */
  function handleInputChange(field: string, value: string | boolean) {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Limpiar error al editar
    setError(null);
  }

  /*
   * Crea el nuevo usuario en el servidor
   */
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    
    // Validación de campos requeridos
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
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    // Validar aerolínea para roles que no sean SUPER_ADMIN
    if (formData.role !== 'SUPER_ADMIN' && !formData.airlineId) {
      setError('Airline is required for non-SUPER_ADMIN users');
      return;
    }
    
    try {
      setCreating(true);
      setError(null);
      
      // Preparar los datos para enviar
      const createData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
        airlineId: formData.role === 'SUPER_ADMIN' ? '' : formData.airlineId,
        active: formData.active,
      };
      
      // Llamar al servicio de creación
      await usersService.create(createData);
      
      // Si todo sale bien, redirigir a la lista de usuarios
      router.push('/dashboard/users');
      
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      {/* Botón de regreso */}
      <Link 
        href="/dashboard/users" 
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Users
      </Link>

      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
        <p className="text-gray-600 mt-1">Create a new user account</p>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
          <span className="text-red-600 mr-2">⚠</span>
          {error}
        </div>
      )}

      {/* Formulario */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleCreateUser} className="space-y-6">
            
            {/* First Name y Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="John"
                required
                disabled={creating}
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Doe"
                required
                disabled={creating}
              />
            </div>

            {/* Email */}
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john.doe@airline.com"
              required
              disabled={creating}
            />

            {/* Password */}
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="••••••••"
              required
              disabled={creating}
            />

            {/* Role y Airline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  disabled={creating}
                  required
                >
                  <option value="VIEWER">VIEWER</option>
                  <option value="EDITOR">EDITOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.role === 'SUPER_ADMIN' && 'SUPER_ADMIN has no airline association'}
                  {formData.role === 'ADMIN' && 'Can manage users within their airline'}
                  {formData.role === 'EDITOR' && 'Can edit content within their airline'}
                  {formData.role === 'VIEWER' && 'Read-only access to airline content'}
                </p>
              </div>

              {/* Airline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Airline {formData.role !== 'SUPER_ADMIN' && <span className="text-red-500">*</span>}
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.airlineId}
                  onChange={(e) => handleInputChange('airlineId', e.target.value)}
                  disabled={creating || loadingAirlines || formData.role === 'SUPER_ADMIN'}
                  required={formData.role !== 'SUPER_ADMIN'}
                >
                  <option value="">
                    {loadingAirlines ? 'Loading airlines...' : 'Select airline...'}
                  </option>
                  {airlines.map((airline) => (
                    <option key={airline.id} value={airline.id}>
                      {airline.name} ({airline.code})
                    </option>
                  ))}
                </select>
                {formData.role === 'SUPER_ADMIN' && (
                  <p className="mt-1 text-xs text-gray-500">
                    SUPER_ADMIN users are not associated with any airline
                  </p>
                )}
                {airlines.length === 0 && !loadingAirlines && (
                  <p className="mt-1 text-xs text-amber-600">
                    No active airlines found. Please create an airline first.
                  </p>
                )}
              </div>
            </div>

            {/* Active Account Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={creating}
              />
              <label htmlFor="active" className="text-sm text-gray-700 cursor-pointer">
                Active account (user can log in immediately)
              </label>
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <Button 
                type="submit" 
                disabled={creating || loadingAirlines || (airlines.length === 0 && formData.role !== 'SUPER_ADMIN')}
              >
                {creating ? 'Creating...' : 'Create User'}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/dashboard/users')}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="text-sm text-gray-500 space-y-1">
        <p>
          <strong>Note:</strong> Password must be at least 8 characters long.
        </p>
        <p>
          Email addresses are automatically converted to lowercase.
        </p>
        {formData.role !== 'SUPER_ADMIN' && airlines.length === 0 && (
          <p className="text-amber-600">
            <strong>Warning:</strong> You need to create at least one active airline before creating non-admin users.
          </p>
        )}
      </div>
    </div>
  );
}