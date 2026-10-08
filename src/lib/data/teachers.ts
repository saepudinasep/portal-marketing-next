import { requireRole } from '@/lib/auth-guard';
import type { Teacher } from '@/lib/dummy-data';
import { dateToUi, genderToUi } from '@/lib/mappers';
import { prisma } from '@/lib/prisma';

export async function getTeachersPageData() {
  await requireRole('admin');

  const [rows, classCount, scheduledRows] = await Promise.all([
    prisma.teacher.findMany({ orderBy: { teacherCode: 'asc' } }),
    prisma.class.count(),
    prisma.detailSchedule.findMany({ distinct: ['teacherId'], select: { teacherId: true } }),
  ]);

  const scheduledIds = new Set(scheduledRows.map((r) => r.teacherId));

  const teachers: Teacher[] = rows.map((t) => ({
    teacherId: t.teacherCode,
    name: t.name,
    address: t.address ?? '',
    gender: genderToUi(t.gender),
    dateOfBirth: dateToUi(t.dateOfBirth),
    phoneNumber: t.phoneNumber ?? '',
    photo: t.photo,
  }));

  return {
    teachers,
    classCount,
    scheduledCount: rows.filter((t) => scheduledIds.has(t.id)).length,
  };
}
