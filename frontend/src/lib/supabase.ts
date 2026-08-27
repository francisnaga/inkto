import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadScannedPage(
  userId: string,
  docId: string,
  pageNumber: number,
  imageBlob: Blob
): Promise<{ path: string; publicUrl?: string }> {
  const filePath = `${userId}/${docId}/page-${pageNumber}.jpg`;

  const { data, error } = await supabase.storage
    .from('scanned-docs')
    .upload(filePath, imageBlob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.warn('Direct Supabase storage upload notice:', error.message);
  }

  const { data: publicData } = supabase.storage
    .from('scanned-docs')
    .getPublicUrl(filePath);

  return {
    path: data?.path || filePath,
    publicUrl: publicData?.publicUrl,
  };
}

export async function uploadScannedPdf(
  userId: string,
  docId: string,
  pdfBlob: Blob
): Promise<{ path: string; publicUrl?: string }> {
  const filePath = `${userId}/${docId}/document.pdf`;

  const { data, error } = await supabase.storage
    .from('scanned-docs')
    .upload(filePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    console.warn('Direct Supabase PDF upload notice:', error.message);
  }

  const { data: publicData } = supabase.storage
    .from('scanned-docs')
    .getPublicUrl(filePath);

  return {
    path: data?.path || filePath,
    publicUrl: publicData?.publicUrl,
  };
}
