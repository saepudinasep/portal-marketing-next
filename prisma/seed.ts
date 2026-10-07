/**
 * Seed data awal dari src/lib/dummy-data.ts ke MongoDB.
 * Jalankan: npx prisma db seed
 *
 * PERINGATAN: skrip ini MENGHAPUS semua data di koleksi terkait lalu mengisinya ulang.
 * Pembuatan User + Teacher/Student memakai nested write (transaksi) -> butuh MongoDB
 * replica set. MongoDB Atlas (termasuk M0 gratis) sudah replica set.
 */
import { hash } from 'bcryptjs';

import { PrismaClient } from '../src/generated/prisma/client';
import * as d from '../src/lib/dummy-data';

const prisma = new PrismaClient();

// Password awal (HANYA untuk dev/demo, wajib diganti lewat halaman Account).
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'smk12345';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234';

const gender = (g: 'Male' | 'Female') => (g === 'Male' ? ('male' as const) : ('female' as const));
const date = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

async function reset() {
  // urutan: tabel anak dulu agar tidak melanggar relasi
  await prisma.detailScore.deleteMany();
  await prisma.detailSchedule.deleteMany();
  await prisma.headerSchedule.deleteMany();
  await prisma.detailClass.deleteMany();
  await prisma.expertise.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
}

async function main() {
  console.log('Menghapus data lama...');
  await reset();

  const passwordHash = await hash(DEFAULT_PASSWORD, 10);

  // --- admin ---
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@gmail.com',
      password: await hash(ADMIN_PASSWORD, 10),
      role: 'admin',
    },
  });

  // --- shift ---
  const shiftIds = new Map<number, string>(); // dummy shiftId -> ObjectId
  for (const s of d.shifts) {
    const row = await prisma.shift.create({ data: { number: s.shiftId, time: s.time } });
    shiftIds.set(s.shiftId, row.id);
  }

  // --- kelas ---
  const classIds = new Map<string, string>(); // className -> ObjectId
  for (const c of d.classes) {
    const row = await prisma.class.create({ data: { name: c.className, grade: c.grade } });
    classIds.set(c.className, row.id);
  }

  // --- mata pelajaran ---
  const subjectIds = new Map<string, string>(); // subjectId (S1001) -> ObjectId
  for (const s of d.subjects) {
    const row = await prisma.subject.create({
      data: {
        code: s.subjectId,
        name: s.name,
        assignment: s.assignment,
        midExam: s.midExam,
        finalExam: s.finalExam,
        shiftDuration: s.shiftDuration,
        grade: s.grade,
      },
    });
    subjectIds.set(s.subjectId, row.id);
  }

  // --- guru (User + Teacher dalam satu nested write) ---
  const teacherIds = new Map<string, string>(); // T0001 -> ObjectId Teacher
  for (const t of d.teachers) {
    const user = await prisma.user.create({
      data: {
        username: t.teacherId,
        password: passwordHash,
        role: 'teacher',
        teacher: {
          create: {
            teacherCode: t.teacherId,
            name: t.name,
            phoneNumber: t.phoneNumber,
            gender: gender(t.gender),
            address: t.address,
            dateOfBirth: date(t.dateOfBirth),
          },
        },
      },
      include: { teacher: true },
    });
    teacherIds.set(t.teacherId, user.teacher!.id);
  }

  // --- siswa (User + Student) ---
  const studentIds = new Map<string, string>(); // 20160001 -> ObjectId Student
  for (const s of d.students) {
    const user = await prisma.user.create({
      data: {
        username: s.studentId,
        password: passwordHash,
        role: 'student',
        student: {
          create: {
            studentCode: s.studentId,
            name: s.name,
            phoneNumber: s.phoneNumber,
            gender: gender(s.gender),
            address: s.address,
            dateOfBirth: date(s.dateOfBirth),
          },
        },
      },
      include: { student: true },
    });
    studentIds.set(s.studentId, user.student!.id);
  }

  // --- keahlian guru ---
  await prisma.expertise.createMany({
    data: d.expertise.map((e) => ({
      teacherId: teacherIds.get(e.teacherId)!,
      subjectId: subjectIds.get(e.subjectId)!,
    })),
  });

  // --- header jadwal (satu per kelas) ---
  const headerIds = new Map<number, string>(); // dummy scheduleId -> ObjectId
  for (const h of d.headerSchedules) {
    const row = await prisma.headerSchedule.create({
      data: { classId: classIds.get(h.className)!, finalized: h.finalize === 1 },
    });
    headerIds.set(h.scheduleId, row.id);
  }

  // --- detail jadwal (dibuat satu per satu agar id-nya bisa dipakai untuk nilai) ---
  const detailIds = new Map<number, string>(); // dummy detailId -> ObjectId
  for (const ds of d.detailSchedules) {
    const row = await prisma.detailSchedule.create({
      data: {
        scheduleId: headerIds.get(ds.scheduleId)!,
        subjectId: subjectIds.get(ds.subjectId)!,
        teacherId: teacherIds.get(ds.teacherId)!,
        shiftId: shiftIds.get(ds.shiftId)!,
        day: ds.day,
      },
    });
    detailIds.set(ds.detailId, row.id);
  }

  // --- penempatan siswa ke kelas ---
  await prisma.detailClass.createMany({
    data: d.detailClasses.map((dc) => ({
      classId: classIds.get(dc.className)!,
      studentId: studentIds.get(dc.studentId)!,
    })),
  });

  // --- nilai ---
  await prisma.detailScore.createMany({
    data: d.detailScores.map((sc) => ({
      detailId: detailIds.get(sc.detailId)!,
      studentId: studentIds.get(sc.studentId)!,
      assignment: sc.assignment,
      midExam: sc.midExam,
      finalExam: sc.finalExam,
    })),
  });

  console.log('Seed selesai:', {
    users: 1 + d.teachers.length + d.students.length,
    teachers: d.teachers.length,
    students: d.students.length,
    classes: d.classes.length,
    subjects: d.subjects.length,
    detailSchedules: d.detailSchedules.length,
    detailScores: d.detailScores.length,
  });
  console.log(
    `Login admin: admin / ${ADMIN_PASSWORD}  |  guru & siswa: <kode> / ${DEFAULT_PASSWORD}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
