/**
 * Upload an image file to the AfriVogue backend API.
 * Replaces all Supabase Storage upload patterns.
 *
 * Usage:
 *   import { uploadImage } from '@/lib/uploadImage';
 *   const url = await uploadImage(file);
 */
export async function uploadImage(file: File): Promise<string> {
  const token = localStorage.getItem('afrivogue_token');
  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${apiBase}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error ?? 'Upload failed');
  }

  const data = await res.json();
  return data.url as string;
}
