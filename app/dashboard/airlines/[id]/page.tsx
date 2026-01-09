'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import { airlinesService, Airline } from '@/lib/airlines';

export default function EditAirlinePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Desenvolver la Promise de params para obtener el ID
  const unwrappedParams = use(params);
  const airlineId = unwrappedParams.id;
  
  const router = useRouter();
  
  // Estados del componente
  const [airline, setAirline] = useState<Airline | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    logo: '',
    primaryColor: '#0078D2',
    secondaryColor: '#C8102E',
    active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cargar datos cuando el componente se monta o el ID cambia
  useEffect(() => {
    loadAirlineData();
  }, [airlineId]);

  /*
   * Carga los datos de la aerolínea desde el servidor
   */
  async function loadAirlineData() {
    try {
      setLoading(true);
      setError(null);
      
      if (!airlineId) {
        throw new Error('No airline ID provided');
      }
      
      const data = await airlinesService.getById(airlineId);
      
      if (!data) {
        throw new Error('Airline not found');
      }
      
      setAirline(data);
      
      // Llenar el formulario con los datos obtenidos
      setFormData({
        name: data.name || '',
        code: data.code || '',
        logo: data.logo || '',
        primaryColor: data.branding?.primaryColor || '#0078D2',
        secondaryColor: data.branding?.secondaryColor || '#C8102E',
        active: data.active ?? true,
      });
      
    } catch (err) {
      console.error('Error loading airline:', err);
      setError(err instanceof Error ? err.message : 'Failed to load airline data');
    } finally {
      setLoading(false);
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
    // Limpiar mensajes al editar
    setError(null);
    setSuccessMessage(null);
  }

  /*
   * Guarda los cambios en el servidor
   */
  async function handleSaveChanges(e: React.FormEvent) {
    e.preventDefault();
    
    // Validación de campos requeridos
    if (!formData.name.trim()) {
      setError('Airline name is required');
      return;
    }
    
    if (!formData.code.trim()) {
      setError('Airline code is required');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Preparar los datos para enviar al servidor
      const updateData = {
        name: formData.name,
        logo: formData.logo || undefined,
        branding: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
        },
        active: formData.active,
      };
      
      // Actualizar en el servidor
      await airlinesService.update(airlineId, updateData);
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Airline updated successfully!');
      
      // Recargar los datos actualizados
      await loadAirlineData();
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard/airlines');
      }, 2000);
      
    } catch (err) {
      console.error('Error updating airline:', err);
      setError(err instanceof Error ? err.message : 'Failed to update airline');
    } finally {
      setSaving(false);
    }
  }

  /*
   * Elimina la aerolínea después de confirmar
   */
  async function handleDelete() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this airline? This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await airlinesService.delete(airlineId);
      
      // Redirigir a la lista después de eliminar
      router.push('/dashboard/airlines');
      
    } catch (err) {
      console.error('Error deleting airline:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete airline');
      setSaving(false);
    }
  }

  // PANTALLA DE CARGA
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading airline data...</p>
        </div>
      </div>
    );
  }

  // PANTALLA DE ERROR
  if (error && !airline) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Link 
          href="/dashboard/airlines" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Airlines
        </Link>

        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="text-red-600 text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Error Loading Airline
              </h3>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="flex justify-center space-x-3">
                <Button onClick={loadAirlineData}>
                  Try Again
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/dashboard/airlines')}
                >
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // PANTALLA DE "NOT FOUND"
  if (!airline) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Link 
          href="/dashboard/airlines" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Airlines
        </Link>

        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="text-gray-400 text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Airline Not Found
              </h3>
              <p className="text-gray-600 mb-6">
                The airline you're looking for could not be found.
              </p>
              <Button onClick={() => router.push('/dashboard/airlines')}>
                Back to Airlines List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // FORMULARIO PRINCIPAL
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      {/* Botón de regreso */}
      <Link 
        href="/dashboard/airlines" 
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Airlines
      </Link>

      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Edit Airline</h2>
        <p className="text-gray-600 mt-1">Update airline information and settings</p>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
          <span className="text-green-600 mr-2">✓</span>
          {successMessage}
        </div>
      )}
      
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
          <form onSubmit={handleSaveChanges} className="space-y-6">
            
            {/* Nombre y Código */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Airline Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                disabled={saving}
                placeholder="Enter airline name"
              />
              <Input
                label="Airline Code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                maxLength={3}
                required
                disabled={true}
                placeholder="AAA"
                title="Airline code cannot be changed after creation"
              />
            </div>

            {/* Logo URL */}
            <Input
              label="Logo URL"
              value={formData.logo}
              onChange={(e) => handleInputChange('logo', e.target.value)}
              type="url"
              disabled={saving}
              placeholder="https://example.com/logo.png"
            />

            {/* Colores de Branding */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Branding Colors
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Color Primario */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      disabled={saving}
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      disabled={saving}
                      placeholder="#0078D2"
                    />
                  </div>
                </div>
                
                {/* Color Secundario */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      disabled={saving}
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      disabled={saving}
                      placeholder="#C8102E"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Estado Activo/Inactivo */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={saving}
              />
              <label htmlFor="active" className="text-sm text-gray-700 cursor-pointer">
                Active (airline is visible and can be selected)
              </label>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              <Button 
                type="submit" 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/dashboard/airlines')}
                disabled={saving}
              >
                Cancel
              </Button>
              
              <Button
                type="button"
                variant="danger"
                className="ml-auto"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Delete Airline'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="text-sm text-gray-500">
        <p>
          <strong>Note:</strong> Airline code cannot be changed once created. 
          Changes to branding colors will affect all airline-related displays.
        </p>
      </div>
    </div>
  );
}