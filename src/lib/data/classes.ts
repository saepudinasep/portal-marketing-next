import { requireRole } from '@/lib/auth-guard';
import { genderToUi } from '@/lib/mappers';
import { prisma } from '@/lib/prisma';
import type { ManageClassData } from '@/lib/schedule-types';

export async function getManageClassData(): Promise<ManageClassData> {
  await requireRole('admin');

  const [classes, students] = await Promise.all([
    prisma.class.findMany({ orderBy: [{ grade: 'asc' }, { name: 'asc' }] }),
    prisma.student.findMany({
      orderBy: { studentCode: 'asc' },
      select: {
        studentCode: true,
        name: true,
        gender: true,
        class: { select: { class: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    classes: classes.map((c) => ({ className: c.name, grade: c.grade })),
    students: students.map((s) => ({
      studentId: s.studentCode,
      name: s.name,
      gender: genderToUi(s.gender),
    })),
    assignments: Object.fromEntries(
      students.flatMap((s) => (s.class ? [[s.studentCode, s.class.class.name]] : [])),
    ),
  };
}
