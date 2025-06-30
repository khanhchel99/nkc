import { createClient } from '@supabase/supabase-js';
import { env } from '@/env';

// Create Supabase client
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Upload inspection photo to Supabase Storage
 */
export async function uploadInspectionPhoto(
  file: File,
  orderId: string,
  itemId: number,
  category: string
): Promise<string> {
  // Validate environment variables
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing. Please check your environment variables.');
  }

  if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    throw new Error('Supabase anonymous key is not configured. Please update your .env file with the real key.');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const fileName = `${timestamp}-${category}.${fileExt}`;
  const filePath = `inspection-photos/${orderId}/item-${itemId}/${fileName}`;

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from('inspection-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('Bucket not found')) {
      throw new Error('Storage bucket "inspection-photos" not found. Please create it in your Supabase dashboard.');
    } else if (error.message.includes('row-level security')) {
      throw new Error('Storage access denied. Please check your Supabase storage policies.');
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('inspection-photos')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Delete inspection photo from Supabase Storage
 */
export async function deleteInspectionPhoto(imageUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/inspection-photos\/(.+)$/);
    
    if (!pathMatch || !pathMatch[1]) {
      throw new Error('Invalid image URL format');
    }

    const filePath = pathMatch[1];

    const { error } = await supabase.storage
      .from('inspection-photos')
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
}

/**
 * Delete all inspection photos for an order
 */
export async function deleteOrderInspectionPhotos(orderId: string): Promise<void> {
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('inspection-photos')
      .list(`inspection-photos/${orderId}`, {
        limit: 1000,
        offset: 0
      });

    if (listError) {
      console.error('Error listing files:', listError);
      throw new Error(`Failed to list files: ${listError.message}`);
    }

    if (!files || files.length === 0) {
      console.log(`No inspection photos found for order ${orderId}`);
      return;
    }

    // Delete all files
    const filePaths = files.map(file => `inspection-photos/${orderId}/${file.name}`);
    
    const { error: deleteError } = await supabase.storage
      .from('inspection-photos')
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting files:', deleteError);
      throw new Error(`Failed to delete files: ${deleteError.message}`);
    }

    console.log(`Successfully deleted ${files.length} inspection photos for order ${orderId}`);
  } catch (error) {
    console.error('Error deleting order photos:', error);
    throw error;
  }
}
