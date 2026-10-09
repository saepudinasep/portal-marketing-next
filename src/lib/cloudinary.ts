import { v2 as cloudinary } from 'cloudinary';

const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

cloudinary.config({
  cloud_name: cloudName,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export const PHOTO_FOLDER = 'smk-nusantara/profile';
export const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'] as const;
// Cloudinary memperkecil gambar saat unggah (sisi terpanjang maksimal 800 px).
const TRANSFORMATION = 'c_limit,h_800,w_800';

/** Satu foto per pengguna dengan public_id tetap, jadi mengganti foto menimpa yang lama (tidak ada sisa). */
export const photoPublicId = (userId: string) => `${PHOTO_FOLDER}/${userId}`;

export const cloudinaryReady = () =>
  Boolean(cloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

/** URL dibangun di server dari data yang sudah divalidasi, bukan dipercaya dari klien. */
export const buildPhotoUrl = (publicId: string, version: number, format: string) =>
  `https://res.cloudinary.com/${cloudName}/image/upload/v${version}/${publicId}.${format}`;

/**
 * Tanda tangan unggah langsung dari browser ke Cloudinary. Parameter ikut ditandatangani, jadi klien
 * tidak bisa mengubah public_id (hanya bisa menimpa fotonya sendiri), format, atau ukuran maksimal.
 */
export function signUpload(userId: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    allowed_formats: ALLOWED_FORMATS.join(','),
    invalidate: 'true',
    overwrite: 'true',
    public_id: photoPublicId(userId),
    timestamp,
    transformation: TRANSFORMATION,
  };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
  return {
    cloudName: cloudName!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    timestamp,
    signature,
    publicId: params.public_id,
    allowedFormats: params.allowed_formats,
    transformation: params.transformation,
  };
}
