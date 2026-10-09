'use server';

import { revalidatePath } from 'next/cache';

import type { ActionResult, ResetResult } from '@/actions/result';
import { Prisma } from '@/generated/prisma/client';
import { requireRole } from '@/lib/auth-guard';
import { dateToDb, genderToDb } from '@/lib/mappers';
import { generateTempPassword, hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { studentSchema } from '@/lib/validations';

// Password awal akun siswa baru. Wajib diganti pemiliknya lewat halaman Account.
const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD ?? 'smk12345';

function failure(error: unknown, duplicateMessage: string): ActionResult {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return { ok: false, error: duplicateMessage };
    if (error.code === 'P2025')
      return { ok: false, error: 'Student not found. It may have been deleted.' };
  }
  console.error(error);
  return { ok: false, error: 'Something went wrong. Please try again.' };
}

export async function createStudent(input: unknown): Promise<ActionResult> {
  await requireRole('admin');
  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const s = parsed.data;

  try {
    // User + Student dibuat sekaligus (satu transaksi)
    await prisma.user.create({
      data: {
        username: s.studentId,
        password: await hashPassword(DEFAULT_PASSWORD),
        mustChangePassword: true,
        role: 'student',
        student: {
          create: {
            studentCode: s.studentId,
            name: s.name,
            address: s.address,
            gender: genderToDb(s.gender),
            dateOfBirth: dateToDb(s.dateOfBirth),
            phoneNumber: s.phoneNumber,
          },
        },
      },
    });
  } catch (e) {
    return failure(e, 'Student ID already exists.');
  }

  revalidatePath('/manage-student');
  return { ok: true };
}

export async function updateStudent(input: unknown): Promise<ActionResult> {
  await requireRole('admin');
  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const s = parsed.data;

  try {
    await prisma.student.update({
      where: { studentCode: s.studentId },
      data: {
        name: s.name,
        address: s.address,
        gender: genderToDb(s.gender),
        dateOfBirth: dateToDb(s.dateOfBirth),
        phoneNumber: s.phoneNumber,
      },
    });
  } catch (e) {
    return failure(e, 'Student ID already exists.');
  }

  revalidatePath('/manage-student');
  return { ok: true };
}

export async function deleteStudent(studentId: string): Promise<ActionResult> {
  await requireRole('admin');

  try {
    const student = await prisma.student.findUnique({
      where: { studentCode: studentId },
      select: { id: true, userId: true },
    });
    if (!student) return { ok: false, error: 'Student not found. It may have been deleted.' };

    // Hapus berurutan dalam satu transaksi: nilai, kelas, siswa, lalu akun login-nya.
    await prisma.$transaction([
      prisma.detailScore.deleteMany({ where: { studentId: student.id } }),
      prisma.detailClass.deleteMany({ where: { studentId: student.id } }),
      prisma.student.delete({ where: { id: student.id } }),
      prisma.user.delete({ where: { id: student.userId } }),
    ]);
  } catch (e) {
    return failure(e, 'Student could not be deleted.');
  }

  revalidatePath('/manage-student');
  return { ok: true };
}

/** Admin mengatur ulang password: dibuat password sementara acak, ditampilkan SEKALI ke admin. */
export async function resetStudentPassword(studentId: string): Promise<ResetResult> {
  await requireRole('admin');

  try {
    const row = await prisma.student.findUnique({
      where: { studentCode: studentId },
      select: { userId: true },
    });
    if (!row) return { ok: false, error: 'Student not found. It may have been deleted.' };

    const password = generateTempPassword();
    await prisma.user.update({
      where: { id: row.userId },
      data: { password: await hashPassword(password), mustChangePassword: true },
    });
    return { ok: true, password };
  } catch (e) {
    console.error(e);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}
