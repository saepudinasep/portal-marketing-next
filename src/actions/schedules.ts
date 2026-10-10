'use server';

import { revalidatePath } from 'next/cache';

import type { ActionResult } from '@/actions/result';
import { Prisma } from '@/generated/prisma/client';
import { requireRole } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { sessionCreateSchema, sessionIdSchema, sessionUpdateSchema } from '@/lib/validations';

const GENERIC = { ok: false as const, error: 'Something went wrong. Please try again.' };
const LOCKED = 'This schedule is finalized and can no longer be changed.';
const TAKEN = 'That slot was just taken by another change. Refresh the page and try again.';

function refresh() {
  revalidatePath('/manage-schedule');
  revalidatePath('/finalize-schedule');
}

type Fields = { subjectId: string; teacherId: string; shiftId: number };

/**
 * Aturan yang dijaga di server (UI hanya membantu): kelas belum difinalisasi, mata pelajaran
 * sesuai tingkat kelas, guru punya keahlian, tidak bentrok (kelas maupun guru). Basis data
 * juga menjaganya lewat indeks unik sebagai pengaman terakhir saat dua admin menyimpan bersamaan.
 */
async function validateSession(
  where: { className: string; day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' },
  f: Fields,
  editingId: string | null,
) {
  const cls = await prisma.class.findUnique({
    where: { name: where.className },
    select: { id: true, grade: true, schedule: { select: { id: true, finalized: true } } },
  });
  if (!cls) return { ok: false as const, error: 'Class not found.' };
  if (cls.schedule?.finalized) return { ok: false as const, error: LOCKED };

  const subject = await prisma.subject.findUnique({
    where: { code: f.subjectId },
    select: {
      id: true,
      grade: true,
      expertise: { where: { teacher: { teacherCode: f.teacherId } }, select: { id: true } },
    },
  });
  if (!subject) return { ok: false as const, error: 'Subject not found.' };
  if (subject.grade !== cls.grade) {
    return { ok: false as const, error: 'This subject is not taught in the grade of this class.' };
  }
  if (subject.expertise.length === 0) {
    return { ok: false as const, error: 'The selected teacher has no expertise in this subject.' };
  }

  const [teacher, shift] = await Promise.all([
    prisma.teacher.findUnique({ where: { teacherCode: f.teacherId }, select: { id: true } }),
    prisma.shift.findUnique({ where: { number: f.shiftId }, select: { id: true } }),
  ]);
  if (!teacher) return { ok: false as const, error: 'Teacher not found.' };
  if (!shift) return { ok: false as const, error: 'Shift not found.' };

  // header jadwal dibuat bila kelas ini belum punya
  const scheduleId =
    cls.schedule?.id ?? (await prisma.headerSchedule.create({ data: { classId: cls.id } })).id;
  const notSelf = editingId ? { id: { not: editingId } } : {};

  const classSlot = await prisma.detailSchedule.findFirst({
    where: { scheduleId, day: where.day, shiftId: shift.id, ...notSelf },
    select: { id: true },
  });
  if (classSlot) {
    return { ok: false as const, error: 'This class already has a subject at that day and shift.' };
  }

  const busy = await prisma.detailSchedule.findFirst({
    where: { teacherId: teacher.id, day: where.day, shiftId: shift.id, ...notSelf },
    select: { schedule: { select: { class: { select: { name: true } } } } },
  });
  if (busy) {
    return {
      ok: false as const,
      error: `The teacher already teaches class ${busy.schedule.class.name} at that day and shift.`,
    };
  }

  return {
    ok: true as const,
    scheduleId,
    subjectId: subject.id,
    teacherId: teacher.id,
    shiftId: shift.id,
  };
}

function mapError(e: unknown): ActionResult {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') return { ok: false, error: TAKEN };
    if (e.code === 'P2025')
      return { ok: false, error: 'Session not found. Refresh the page and try again.' };
  }
  console.error(e);
  return GENERIC;
}

export async function createSession(input: unknown): Promise<ActionResult> {
  await requireRole('admin');
  const parsed = sessionCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { className, day, ...fields } = parsed.data;

  try {
    const check = await validateSession({ className, day }, fields, null);
    if (!check.ok) return check;

    await prisma.detailSchedule.create({
      data: {
        scheduleId: check.scheduleId,
        subjectId: check.subjectId,
        teacherId: check.teacherId,
        shiftId: check.shiftId,
        day,
      },
    });
  } catch (e) {
    return mapError(e);
  }

  refresh();
  return { ok: true };
}

export async function updateSession(input: unknown): Promise<ActionResult> {
  await requireRole('admin');
  const parsed = sessionUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, ...fields } = parsed.data;

  try {
    const existing = await prisma.detailSchedule.findUnique({
      where: { id },
      select: {
        day: true,
        subject: { select: { code: true } },
        schedule: { select: { finalized: true, class: { select: { name: true } } } },
        _count: { select: { scores: true } },
      },
    });
    if (!existing)
      return { ok: false, error: 'Session not found. Refresh the page and try again.' };
    if (existing.schedule.finalized) return { ok: false, error: LOCKED };
    if (existing._count.scores > 0 && existing.subject.code !== fields.subjectId) {
      return {
        ok: false,
        error: 'Scores were already entered for this session, so its subject cannot be changed.',
      };
    }

    // kelas dan hari tidak berubah saat update
    const check = await validateSession(
      { className: existing.schedule.class.name, day: existing.day },
      fields,
      id,
    );
    if (!check.ok) return check;

    await prisma.detailSchedule.update({
      where: { id },
      data: { subjectId: check.subjectId, teacherId: check.teacherId, shiftId: check.shiftId },
    });
  } catch (e) {
    return mapError(e);
  }

  refresh();
  return { ok: true };
}

export async function deleteSession(id: string): Promise<ActionResult> {
  await requireRole('admin');
  const parsed = sessionIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    const existing = await prisma.detailSchedule.findUnique({
      where: { id: parsed.data },
      select: { schedule: { select: { finalized: true } }, _count: { select: { scores: true } } },
    });
    if (!existing) return { ok: false, error: 'Session not found. It may have been deleted.' };
    if (existing.schedule.finalized) return { ok: false, error: LOCKED };
    if (existing._count.scores > 0) {
      return {
        ok: false,
        error: 'Scores were already entered for this session, so it cannot be deleted.',
      };
    }

    await prisma.detailSchedule.delete({ where: { id: parsed.data } });
  } catch (e) {
    return mapError(e);
  }

  refresh();
  return { ok: true };
}

/** Finalisasi: hanya bila setiap mata pelajaran tingkat kelas itu punya minimal satu sesi. Tidak bisa dibatalkan. */
export async function finalizeSchedule(className: string): Promise<ActionResult> {
  await requireRole('admin');
  if (typeof className !== 'string' || !className.trim() || className.length > 5) {
    return { ok: false, error: 'Class not found.' };
  }

  try {
    const cls = await prisma.class.findUnique({
      where: { name: className },
      select: { id: true, grade: true, schedule: { select: { id: true, finalized: true } } },
    });
    if (!cls) return { ok: false, error: 'Class not found.' };
    if (cls.schedule?.finalized) return { ok: false, error: 'This schedule is already finalized.' };
    if (!cls.schedule) return { ok: false, error: 'Cannot finalize an empty schedule.' };

    const [subjects, sessions] = await Promise.all([
      prisma.subject.findMany({
        where: { grade: cls.grade },
        select: { id: true, code: true, name: true },
      }),
      prisma.detailSchedule.findMany({
        where: { scheduleId: cls.schedule.id },
        select: { subjectId: true },
      }),
    ]);
    if (sessions.length === 0) return { ok: false, error: 'Cannot finalize an empty schedule.' };

    const scheduled = new Set(sessions.map((s) => s.subjectId));
    const missing = subjects.filter((s) => !scheduled.has(s.id));
    if (missing.length > 0) {
      return {
        ok: false,
        error: `Cannot finalize yet. Not scheduled: ${missing.map((s) => `${s.code} ${s.name}`).join(', ')}.`,
      };
    }

    // updateMany + syarat finalized:false mencegah dua admin memfinalisasi bersamaan
    const result = await prisma.headerSchedule.updateMany({
      where: { id: cls.schedule.id, finalized: false },
      data: { finalized: true },
    });
    if (result.count === 0) return { ok: false, error: 'This schedule is already finalized.' };
  } catch (e) {
    console.error(e);
    return GENERIC;
  }

  refresh();
  return { ok: true };
}
