'use server';

import { compare } from 'bcryptjs';

import type { ActionResult } from '@/actions/result';
import { signOut } from '@/auth';
import { requireUser } from '@/lib/auth-guard';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { changePasswordSchema } from '@/lib/validations';

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
