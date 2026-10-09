import { getPhotoUploadSignature } from '@/actions/account';

export type UploadedPhoto = { publicId: string; version: number; format: string };

/** Unggah langsung ke Cloudinary memakai tanda tangan dari server. Melempar Error berisi pesan yang bisa ditampilkan. */
export async function uploadProfilePhoto(file: File): Promise<UploadedPhoto> {
  const sig = await getPhotoUploadSignature();
  if (!sig.ok) throw new Error(sig.error);
  const d = sig.data;

  const body = new FormData();
  body.append('file', file);
  body.append('api_key', d.apiKey);
  body.append('timestamp', String(d.timestamp));
  body.append('signature', d.signature);
  body.append('public_id', d.publicId);
  body.append('overwrite', 'true');
  body.append('invalidate', 'true');
  body.append('allowed_formats', d.allowedFormats);
  body.append('transformation', d.transformation);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${d.cloudName}/image/upload`, {
    method: 'POST',
    body,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.public_id) {
    throw new Error(json?.error?.message ?? 'Photo upload failed. Please try again.');
  }
  return { publicId: json.public_id, version: json.version, format: json.format };
}
