'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import { airlinesService } from '@/lib/airlines';

export default function NewAirlinePage() {
  const router = useRouter();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    logo: '',
    primaryColor: '#0078D2',
    secondaryColor: '#C8102E',
  });
  
  // Estados de control
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Maneja los cambios en los inputs del formulario
   */
  function handleInputChange(field: string, value: string) {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Limpiar error al editar
    setError(null);
  }

  /**
   * Crea la nueva aerolínea en el servidor
   */
  async function handleCreateAirline(e: React.FormEvent) {
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
    
    // Validar que el código tenga máximo 3 caracteres
    if (formData.code.length > 3) {
      setError('Airline code must be 3 characters or less');
      return;
    }
    
    try {
      setCreating(true);
      setError(null);
      
      // Preparar los datos para enviar
      const createData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(), // Convertir a mayúsculas
        logo: formData.logo.trim() || undefined, // Si está vacío, no enviar
        branding: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
        },
      };
      
      // Llamar al servicio de creación
      await airlinesService.create(createData);
      
      // Si todo sale bien, redirigir a la lista de aerolíneas
      router.push('/dashboard/airlines');
      
    } catch (err) {
      console.error('Error creating airline:', err);
      setError(err instanceof Error ? err.message : 'Failed to create airline');
    } finally {
      setCreating(false);
    }
  }

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
        <h2 className="text-2xl font-bold text-gray-900">Add New Airline</h2>
        <p className="text-gray-600 mt-1">Create a new airline tenant</p>
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
          <form onSubmit={handleCreateAirline} className="space-y-6">
            
            {/* Nombre y Código */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Airline Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., American Airlines"
                required
                disabled={creating}
              />
              <Input
                label="Code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="e.g., AA"
                maxLength={3}
                required
                disabled={creating}
              />
            </div>

            {/* Logo URL */}
            <Input
              label="Logo URL"
              value={formData.logo}
              onChange={(e) => handleInputChange('logo', e.target.value)}
              type="url"
              placeholder="https://example.com/logo.png"
              disabled={creating}
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
                      disabled={creating}
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      placeholder="#0078D2"
                      disabled={creating}
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
                      disabled={creating}
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      placeholder="#C8102E"
                      disabled={creating}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <Button 
                type="submit" 
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Airline'}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/dashboard/airlines')}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="text-sm text-gray-500">
        <p>
          <strong>Note:</strong> The airline code will be converted to uppercase 
          and must be unique. It cannot be changed after creation.
        </p>
      </div>
    </div>
  );
}