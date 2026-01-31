import { supabase } from './supabase';

export const storageService = {
  // ============================================
  // CHAPTER IMAGES
  // ============================================
  
  async uploadChapterImage(file: File, chapterId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${chapterId}-${Date.now()}.${fileExt}`;
    const filePath = `chapters/${fileName}`;

    const { data, error } = await supabase.storage
      .from('chapter-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('chapter-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  },

  async deleteChapterImage(imageUrl: string): Promise<void> {
    const urlParts = imageUrl.split('/chapter-images/');
    if (urlParts.length !== 2) return;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('chapter-images')
      .remove([filePath]);

    if (error) {
      console.error('Failed to delete image:', error);
    }
  },

  // ============================================
  // SECTION IMAGES
  // ============================================
  
  /**
   * Sube una imagen de sección a Supabase Storage
   * @param file - Archivo de imagen a subir
   * @param sectionId - ID de la sección
   * @returns URL pública de la imagen subida
   */
  async uploadSectionImage(file: File, sectionId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${sectionId}-${Date.now()}.${fileExt}`;
      const filePath = `sections/${fileName}`;

      const { data, error } = await supabase.storage
        .from('chapter-images') // Usando el mismo bucket
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload section image: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('chapter-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadSectionImage:', error);
      throw error;
    }
  },

  /**
   * Elimina una imagen de sección de Supabase Storage
   * @param imageUrl - URL de la imagen a eliminar
   */
  async deleteSectionImage(imageUrl: string): Promise<void> {
    try {
      const urlParts = imageUrl.split('/chapter-images/');
      if (urlParts.length !== 2) {
        console.warn('Invalid section image URL format');
        return;
      }

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('chapter-images')
        .remove([filePath]);

      if (error) {
        console.error('Failed to delete section image:', error);
      }
    } catch (error) {
      console.error('Error in deleteSectionImage:', error);
    }
  },

  // ============================================
  // AIRLINE LOGOS
  // ============================================

  /**
   * Sube el logo de una aerolínea a Supabase Storage
   * @param file - Archivo de imagen a subir
   * @param airlineId - ID de la aerolínea
   * @returns URL pública del logo subido
   */
  async uploadAirlineLogo(file: File, airlineId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${airlineId}-${Date.now()}.${fileExt}`;
      const filePath = `airlines/${fileName}`;

      const { data, error } = await supabase.storage
        .from('chapter-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Error uploading airline logo:', error);
        throw new Error('Failed to upload airline logo');
      }

      const { data: urlData } = supabase.storage
        .from('chapter-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadAirlineLogo:', error);
      throw error;
    }
  },

  /**
   * Elimina el logo de una aerolínea de Supabase Storage
   * @param logoUrl - URL del logo a eliminar
   */
  async deleteAirlineLogo(logoUrl: string): Promise<void> {
    try {
      const urlParts = logoUrl.split('/');
      const filePath = `airlines/${urlParts[urlParts.length - 1]}`;

      const { error } = await supabase.storage
        .from('chapter-images')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting airline logo:', error);
        throw new Error('Failed to delete airline logo');
      }
    } catch (error) {
      console.error('Error in deleteAirlineLogo:', error);
      throw error;
    }
  },

  // ============================================
  // GENERIC IMAGE VALIDATION
  // ============================================

  /**
   * Valida un archivo de imagen
   * @param file - Archivo a validar
   * @param maxSizeMB - Tamaño máximo en MB (default: 5MB)
   * @returns Error message si hay error, null si es válido
   */
  validateImageFile(file: File, maxSizeMB: number = 5): string | null {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    
    if (!validTypes.includes(file.type)) {
      return 'Please select a valid image file (JPG, PNG, or WebP)';
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `Image size must be less than ${maxSizeMB}MB`;
    }

    return null;
  }
};