'use server';

import { revalidatePath } from 'next/cache';

import type { ActionResult } from '@/actions/result';
import { Prisma } from '@/generated/prisma/client';
import { requireRole } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { classMembersSchema } from '@/lib/validations';

const GENERIC = { ok: false as const, error: 'Something went wrong. Please try again.' };
const STALE = 'The class list has changed. Refresh the page and try again.';

function refresh() {
  revalidatePath('/manage-class');
  revalidatePath('/manage-student');
}

/** Masukkan siswa (yang belum punya kelas) ke sebuah kelas. Satu siswa hanya boleh di satu kelas. */
export async function assignStudents(
  className: string,
  studentIds: string[],
): Promise<ActionResult> {
  await requireRole('admin');
  const parsed = classMembersSchema.safeParse({ className, studentIds });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const ids = [...new Set(parsed.data.studentIds)];

  try {
    const cls = await prisma.class.findUnique({
      where: { name: parsed.data.className },
      select: { id: true },
    });
    if (!cls) return { ok: false, error: 'Class not found.' };

    const students = await prisma.student.findMany({
      where: { studentCode: { in: ids } },
      select: { id: true, class: { select: { id: true } } },
    });
    if (students.length !== ids.length) return { ok: false, error: STALE };

    const taken = students.filter((s) => s.class).length;
    if (taken > 0) {
      return {
        ok: false,
        error: `${taken} of the selected students already ${taken === 1 ? 'has' : 'have'} a class. Refresh the page and try again.`,
      };
    }

    await prisma.detailClass.createMany({
      data: students.map((s) => ({ classId: cls.id, studentId: s.id })),
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { ok: false, error: STALE }; // siswa lain sempat memasukkan lebih dulu (indeks unik studentId)
    }
    console.error(e);
    return GENERIC;
  }

  refresh();
  return { ok: true };
}

/** Keluarkan siswa dari kelas. Ditolak bila siswa sudah punya nilai di kelas itu (agar nilai tidak yatim). */
export async function removeStudents(
  className: string,
  studentIds: string[],
): Promise<ActionResult> {
  await requireRole('admin');
  const parsed = classMembersSchema.safeParse({ className, studentIds });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const ids = [...new Set(parsed.data.studentIds)];

  try {
    const cls = await prisma.class.findUnique({
      where: { name: parsed.data.className },
      select: { id: true },
    });
    if (!cls) return { ok: false, error: 'Class not found.' };

    const students = await prisma.student.findMany({
      where: { studentCode: { in: ids } },
      select: { id: true, class: { select: { classId: true } } },
    });
    const members = students.filter((s) => s.class?.classId === cls.id);
    if (students.length !== ids.length || members.length !== ids.length)
      return { ok: false, error: STALE };

    const withScores = await prisma.detailScore.count({
      where: {
        studentId: { in: members.map((s) => s.id) },
        detail: { schedule: { classId: cls.id } },
      },
    });
    if (withScores > 0) {
      return {
        ok: false,
        error:
          'Some of the selected students already have scores recorded in this class, so they cannot be removed.',
      };
    }

    await prisma.detailClass.deleteMany({
      where: { classId: cls.id, studentId: { in: members.map((s) => s.id) } },
    });
  } catch (e) {
    console.error(e);
    return GENERIC;
  }

  refresh();
  return { ok: true };
}
