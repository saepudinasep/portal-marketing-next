'use server';

import { revalidatePath } from 'next/cache';

import type { ActionResult, ResetResult } from '@/actions/result';
import { Prisma } from '@/generated/prisma/client';
import { requireRole } from '@/lib/auth-guard';
import { dateToDb, genderToDb } from '@/lib/mappers';
import { generateTempPassword, hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { teacherSchema } from '@/lib/validations';

// Password awal akun guru baru. Wajib diganti pemiliknya lewat halaman Account.
const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD ?? 'smk12345';

function failure(error: unknown, duplicateMessage: string): ActionResult {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return { ok: false, error: duplicateMessage };
    if (error.code === 'P2025')
      return { ok: false, error: 'Teacher not found. It may have been deleted.' };
  }
  console.error(error);
  return { ok: false, error: 'Something went wrong. Please try again.' };
}

export async function createTeacher(input: unknown): Promise<ActionResult> {
  await requireRole('admin');
  const parsed = teacherSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const t = parsed.data;

  try {
    await prisma.user.create({
      data: {
        username: t.teacherId,
        password: await hashPassword(DEFAULT_PASSWORD),
        mustChangePassword: true,
        role: 'teacher',
        teacher: {
          create: {
            teacherCode: t.teacherId,
            name: t.name,
            address: t.address,
            gender: genderToDb(t.gender),
            dateOfBirth: dateToDb(t.dateOfBirth),
            phoneNumber: t.phoneNumber,
          },
        },
      },
    });
  } catch (e) {
    return failure(e, 'Teacher ID already exists.');
  }

  revalidatePath('/manage-teacher');
  return { ok: true };
}

export async function updateTeacher(input: unknown): Promise<ActionResult> {
  await requireRole('admin');
  const parsed = teacherSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const t = parsed.data;

  try {
    await prisma.teacher.update({
      where: { teacherCode: t.teacherId },
      data: {
        name: t.name,
        address: t.address,
        gender: genderToDb(t.gender),
        dateOfBirth: dateToDb(t.dateOfBirth),
        phoneNumber: t.phoneNumber,
      },
    });
  } catch (e) {
    return failure(e, 'Teacher ID already exists.');
  }

  revalidatePath('/manage-teacher');
  return { ok: true };
}

export async function deleteTeacher(teacherId: string): Promise<ActionResult> {
  await requireRole('admin');

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { teacherCode: teacherId },
      select: { id: true, userId: true },
    });
    if (!teacher) return { ok: false, error: 'Teacher not found. It may have been deleted.' };

    // Guru yang masih punya jadwal mengajar tidak boleh dihapus.
    const sessions = await prisma.detailSchedule.count({ where: { teacherId: teacher.id } });
    if (sessions > 0) {
      return {
        ok: false,
        error: `This teacher still has ${sessions} teaching ${sessions === 1 ? 'session' : 'sessions'}. Remove them in Manage Schedule first.`,
      };
    }

    await prisma.$transaction([
      prisma.expertise.deleteMany({ where: { teacherId: teacher.id } }),
      prisma.teacher.delete({ where: { id: teacher.id } }),
      prisma.user.delete({ where: { id: teacher.userId } }),
    ]);
  } catch (e) {
    return failure(e, 'Teacher could not be deleted.');
  }

  revalidatePath('/manage-teacher');
  return { ok: true };
}

/** Admin mengatur ulang password: dibuat password sementara acak, ditampilkan SEKALI ke admin. */
export async function resetTeacherPassword(teacherId: string): Promise<ResetResult> {
  await requireRole('admin');

  try {
    const row = await prisma.teacher.findUnique({
      where: { teacherCode: teacherId },
      select: { userId: true },
    });
    if (!row) return { ok: false, error: 'Teacher not found. It may have been deleted.' };

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
