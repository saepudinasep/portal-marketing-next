// Tipe hasil Server Action. Dipisah dari file 'use server' karena file tersebut
// hanya boleh mengekspor fungsi async.
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Hasil reset password oleh admin: password sementara hanya ditampilkan sekali. */
export type ResetResult = { ok: true; password: string } | { ok: false; error: string };

/** Hasil simpan profil: nama dan foto terbaru dikembalikan untuk menyegarkan tampilan. */
export type SaveProfileResult =
  | { ok: true; name: string; photo: string | null }
  | { ok: false; error: string };

export type PhotoSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  allowedFormats: string;
  transformation: string;
};
export type PhotoSignatureResult =
  | { ok: true; data: PhotoSignature }
  | { ok: false; error: string };
