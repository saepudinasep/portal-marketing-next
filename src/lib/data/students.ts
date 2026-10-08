import { requireRole } from '@/lib/auth-guard';
import type { Student } from '@/lib/dummy-data';
import { dateToUi, genderToUi } from '@/lib/mappers';
import { prisma } from '@/lib/prisma';

export async function getStudentsPageData() {
  await requireRole('admin');

  const [rows, classCount] = await Promise.all([
    prisma.student.findMany({ orderBy: { studentCode: 'asc' } }),
    prisma.class.count(),
  ]);

  const students: Student[] = rows.map((s) => ({
    studentId: s.studentCode,
    name: s.name,
    address: s.address ?? '',
    gender: genderToUi(s.gender),
    dateOfBirth: dateToUi(s.dateOfBirth),
    phoneNumber: s.phoneNumber ?? '',
    photo: s.photo,
  }));

  return { students, classCount };
}
