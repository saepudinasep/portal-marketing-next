import { requireRole } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import type { ScheduleBundle } from '@/lib/schedule-types';

/** Seluruh data yang dibutuhkan halaman jadwal. Datanya kecil (satu sekolah), jadi dimuat sekaligus. */
export async function getScheduleBundle(): Promise<ScheduleBundle> {
  await requireRole('admin');

  const [classes, subjects, teachers, shifts, details] = await Promise.all([
    prisma.class.findMany({
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      select: { name: true, grade: true, schedule: { select: { finalized: true } } },
    }),
    prisma.subject.findMany({ orderBy: { code: 'asc' } }),
    prisma.teacher.findMany({
      orderBy: { teacherCode: 'asc' },
      select: {
        teacherCode: true,
        name: true,
        expertise: { select: { subject: { select: { code: true } } } },
      },
    }),
    prisma.shift.findMany({ orderBy: { number: 'asc' } }),
    prisma.detailSchedule.findMany({
      select: {
        id: true,
        day: true,
        schedule: { select: { class: { select: { name: true } } } },
        subject: { select: { code: true } },
        teacher: { select: { teacherCode: true } },
        shift: { select: { number: true } },
      },
    }),
  ]);

  return {
    classes: classes.map((c) => ({
      className: c.name,
      grade: c.grade,
      finalized: c.schedule?.finalized ?? false,
    })),
    subjects: subjects.map((s) => ({ subjectId: s.code, name: s.name, grade: s.grade })),
    teachers: teachers.map((t) => ({
      teacherId: t.teacherCode,
      name: t.name,
      subjectIds: t.expertise.map((e) => e.subject.code),
    })),
    shifts: shifts.map((s) => ({ shiftId: s.number, time: s.time })),
    sessions: details.map((d) => ({
      id: d.id,
      className: d.schedule.class.name,
      day: d.day,
      subjectId: d.subject.code,
      teacherId: d.teacher.teacherCode,
      shiftId: d.shift.number,
    })),
  };
}
