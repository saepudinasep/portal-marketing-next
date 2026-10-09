'use server';

import { compare } from 'bcryptjs';

import { revalidatePath } from 'next/cache';

import type { ActionResult, PhotoSignatureResult, SaveProfileResult } from '@/actions/result';
import { signOut } from '@/auth';
import { requireUser } from '@/lib/auth-guard';
import {
  buildPhotoUrl,
  cloudinary,
  cloudinaryReady,
  photoPublicId,
  signUpload,
} from '@/lib/cloudinary';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import {
  adminProfileSchema,
  changePasswordSchema,
  studentProfileSchema,
  teacherProfileSchema,
} from '@/lib/validations';

/** Ganti password milik pengguna yang sedang login (semua peran). */
export async function changePassword(input: unknown): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { oldPassword, newPassword } = parsed.data;

  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } });
  if (!row || !(await compare(oldPassword, row.password))) {
    return { ok: false, error: 'Old password is incorrect.' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(newPassword), mustChangePassword: false },
  });
  return { ok: true };
}

/** Setelah ganti password: keluar agar sesi baru (tanpa penanda wajib-ganti) dibuat saat login ulang. */
export async function logoutAfterPasswordChange() {
  await signOut({ redirectTo: '/login?changed=1' });
}

// ---------------------------------------------------------------------------
// Profil & foto (Cloudinary)
// ---------------------------------------------------------------------------

/** Tanda tangan agar browser boleh mengunggah SATU foto profil milik pengguna ini langsung ke Cloudinary. */
export async function getPhotoUploadSignature(): Promise<PhotoSignatureResult> {
  const user = await requireUser();
  if (!cloudinaryReady()) return { ok: false, error: 'Photo storage is not configured.' };
  return { ok: true, data: signUpload(user.id) };
}

type PhotoMeta = { publicId: string; version: number; format: string };

/** Hanya terima foto milik sendiri; URL dibangun di server. */
function resolvePhoto(userId: string, photo: PhotoMeta | undefined) {
  if (!photo) return { ok: true as const, fields: null };
  const expected = photoPublicId(userId);
  if (photo.publicId !== expected || !cloudinaryReady()) return { ok: false as const };
  return {
    ok: true as const,
    fields: {
      photo: buildPhotoUrl(expected, photo.version, photo.format),
      photoPublicId: expected,
    },
  };
}

/** Simpan profil sendiri. Guru/siswa: nama, telepon, alamat. Admin: email. Foto opsional. */
export async function saveProfile(input: unknown): Promise<SaveProfileResult> {
  const user = await requireUser();
  const generic = { ok: false as const, error: 'Something went wrong. Please try again.' };

  try {
    if (user.role === 'teacher' || user.role === 'student') {
      const parsed = (
        user.role === 'teacher' ? teacherProfileSchema : studentProfileSchema
      ).safeParse(input);
      if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
      const { name, phoneNumber, address, photo } = parsed.data;
      const resolved = resolvePhoto(user.id, photo);
      if (!resolved.ok) return { ok: false, error: 'Invalid photo. Please upload it again.' };

      const data = { name, phoneNumber, address, ...(resolved.fields ?? {}) };
      const row =
        user.role === 'teacher'
          ? await prisma.teacher.update({
              where: { userId: user.id },
              data,
              select: { name: true, photo: true },
            })
          : await prisma.student.update({
              where: { userId: user.id },
              data,
              select: { name: true, photo: true },
            });
      revalidatePath('/account');
      return { ok: true, name: row.name, photo: row.photo };
    }

    const parsed = adminProfileSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const resolved = resolvePhoto(user.id, parsed.data.photo);
    if (!resolved.ok) return { ok: false, error: 'Invalid photo. Please upload it again.' };

    const row = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: parsed.data.email || null,
        ...(resolved.fields ? { photo: resolved.fields.photo } : {}),
      },
      select: { photo: true },
    });
    revalidatePath('/account');
    return { ok: true, name: 'Administrator', photo: row.photo };
  } catch (e) {
    console.error(e);
    return generic;
  }
}

/** Hapus foto profil: dihapus dari Cloudinary dulu, baru dikosongkan di database. */
export async function removePhoto(): Promise<ActionResult> {
  const user = await requireUser();
  if (!cloudinaryReady()) return { ok: false, error: 'Photo storage is not configured.' };

  try {
    await cloudinary.uploader.destroy(photoPublicId(user.id), { invalidate: true });
    if (user.role === 'teacher') {
      await prisma.teacher.update({
        where: { userId: user.id },
        data: { photo: null, photoPublicId: null },
      });
    } else if (user.role === 'student') {
      await prisma.student.update({
        where: { userId: user.id },
        data: { photo: null, photoPublicId: null },
      });
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { photo: null } });
    }
  } catch (e) {
    console.error(e);
    return { ok: false, error: 'Could not remove the photo. Please try again.' };
  }
  revalidatePath('/account');
  return { ok: true };
}
