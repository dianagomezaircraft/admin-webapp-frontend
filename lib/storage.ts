import { supabase } from './supabase';

export const storageService = {
  async uploadChapterImage(file: File, chapterId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${chapterId}-${Date.now()}.${fileExt}`;
    const filePath = `chapters/${fileName}`;

    // Usar políticas públicas (Opción 1)
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
      // No lanzar error, solo loguear
    }
  },
};