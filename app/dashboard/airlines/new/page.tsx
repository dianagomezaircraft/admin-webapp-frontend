'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { airlinesService } from '@/lib/airlines';
import { storageService } from '@/lib/storage';
import Image from 'next/image';

export default function NewAirlinePage() {
  const router = useRouter();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    primaryColor: '#0078D2',
    secondaryColor: '#C8102E',
  });
  
  // Estados de control
  const [creating, setCreating] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
   * Maneja la selección del archivo de logo
   */
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, WebP, or SVG)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    setLogoFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Remueve el logo seleccionado
   */
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

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
      
      // Create airline first to get the ID
      const createData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(), // Convertir a mayúsculas
        branding: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
        },
      };
      
      // Llamar al servicio de creación
      const newAirline = await airlinesService.create(createData);
      
      // Upload logo if selected
      let logoUrl = null;
      if (logoFile && newAirline.id) {
        setIsUploadingLogo(true);
        logoUrl = await storageService.uploadAirlineLogo(logoFile, newAirline.id);
        
        // Update airline with logo URL
        await airlinesService.update(newAirline.id, {
          logo: logoUrl,
        });
      }
      
      // Si todo sale bien, redirigir a la lista de aerolíneas
      router.push('/dashboard/airlines');
      
    } catch (err) {
      console.error('Error creating airline:', err);
      setError(err instanceof Error ? err.message : 'Failed to create airline');
    } finally {
      setCreating(false);
      setIsUploadingLogo(false);
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

            {/* Logo Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Airline Logo
              </label>
              
              {!logoPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                    disabled={creating}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG, WebP or SVG (max. 5MB)
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <div className="flex items-center justify-center p-6 bg-gray-50">
                    <Image
                      src={logoPreview}
                      alt="Logo Preview"
                      width={200}
                      height={200}
                      className="max-h-32 w-auto object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    disabled={creating}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Optional: Upload a logo for this airline
              </p>
            </div>

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
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isUploadingLogo ? 'Uploading logo...' : 'Creating...'}
                  </>
                ) : (
                  'Create Airline'
                )}
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