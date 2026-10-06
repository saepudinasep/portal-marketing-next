// Data dummy SMK Nusantara — mengikuti ERD & Data Dictionary (LKS SMK XXV 2017).
// Nama field = camelCase dari kolom di data dictionary, jadi nanti mudah diganti ke API/DB.

export type Teacher = {
  teacherId: string; // VARCHAR(8)
  name: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  address: string;
  photo: string | null;
};
export type Subject = {
  subjectId: string; // CHAR(5)
  name: string;
  assignment: number; // bobot %
  midExam: number; // bobot %
  finalExam: number; // bobot %
  shiftDuration: number;
  grade: number;
};
export type ClassRoom = { className: string; grade: number };
export type Student = {
  studentId: string; // VARCHAR(8)
  name: string;
  address: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  phoneNumber: string;
  photo: string | null;
};
export type DetailClass = { detailClassId: number; className: string; studentId: string };
export type Expertise = { expertiseId: number; teacherId: string; subjectId: string };
export type Shift = { shiftId: number; time: string }; // CHAR(13)
export type HeaderSchedule = { scheduleId: number; className: string; finalize: 0 | 1 };
export type DetailSchedule = {
  detailId: number;
  scheduleId: number;
  subjectId: string;
  teacherId: string;
  shiftId: number;
  day: Day;
};
export type DetailScore = {
  scoreDetailId: number;
  detailId: number;
  studentId: string;
  assignment: number | null;
  midExam: number | null;
  finalExam: number | null;
};

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
export type Day = (typeof DAYS)[number];

/** Nilai minimal lulus — ASUMSI (soal tidak menyebutkan), ubah sesuai kebutuhan. */
export const PASSING_SCORE = 70;

export const shifts: Shift[] = [
  '07:00 - 07:45', '07:45 - 08:30', '08:30 - 09:15', '09:30 - 10:15',
  '10:15 - 11:00', '11:00 - 11:45', '12:30 - 13:15', '13:15 - 14:00',
].map((time, i) => ({ shiftId: i + 1, time }));

export const teachers: Teacher[] = [
  ['T0001', 'Deren Pratama', 'Male', '081210000001', '1982-03-14'],
  ['T0002', 'Siti Rahmawati', 'Female', '081210000002', '1985-07-21'],
  ['T0003', 'Budi Santoso', 'Male', '081210000003', '1979-11-02'],
  ['T0004', 'Ratna Dewi', 'Female', '081210000004', '1988-01-30'],
  ['T0005', 'Agus Hermawan', 'Male', '081210000005', '1984-09-09'],
  ['T0006', 'Lestari Ayu', 'Female', '081210000006', '1990-05-17'],
].map(([teacherId, name, gender, phoneNumber, dateOfBirth]) => ({
  teacherId, name, phoneNumber, dateOfBirth,
  gender: gender as Teacher['gender'],
  address: 'Jl. Pendidikan No. 12, Cirebon',
  photo: null,
}));

const subjectNames = ['Agama', 'Matematika', 'Informatika'];
export const subjects: Subject[] = [1, 2, 3].flatMap((g) =>
  subjectNames.map((name, i) => ({
    subjectId: `S${g}00${i + 1}`,
    name,
    assignment: 20,
    midExam: 30,
    finalExam: 50,
    shiftDuration: 2,
    grade: g + 9, // 10, 11, 12
  }))
);

// Keahlian guru (nama mata pelajaran) -> dipetakan ke semua SubjectID bernama sama
const expertiseByTeacher: Record<string, string[]> = {
  T0001: ['Agama'],
  T0002: ['Matematika'],
  T0003: ['Matematika', 'Informatika'],
  T0004: ['Informatika'],
  T0005: ['Informatika', 'Agama'],
  T0006: ['Agama', 'Matematika'],
};
export const expertise: Expertise[] = Object.entries(expertiseByTeacher).flatMap(
  ([teacherId, names]) =>
    subjects.filter((s) => names.includes(s.name)).map((s) => ({ teacherId, subjectId: s.subjectId }))
).map((e, i) => ({ expertiseId: i + 1, ...e }));

export const classes: ClassRoom[] = [
  { className: 'XA', grade: 10 }, { className: 'XB', grade: 10 },
  { className: 'XIA', grade: 11 }, { className: 'XIB', grade: 11 },
  { className: 'XIIA', grade: 12 }, { className: 'XIIB', grade: 12 },
];

const studentSeed: [string, 'Male' | 'Female'][] = [
  ['Mami Rahayu', 'Female'], ['Sonja Tabun', 'Female'], ['Bryan Sentosa', 'Male'], ['Honda Katsuki', 'Male'],
  ['Merry Anggraeni', 'Female'], ['Brandon Wijaya', 'Male'], ['Marco Nugraha', 'Male'], ['Elsa Putri', 'Female'],
  ['Windy Lestari', 'Female'], ['Rizky Ramadhan', 'Male'], ['Nadia Safitri', 'Female'], ['Fajar Hidayat', 'Male'],
  ['Putri Maharani', 'Female'], ['Dimas Saputra', 'Male'], ['Citra Kirana', 'Female'], ['Eko Prasetyo', 'Male'],
  ['Dewi Anggun', 'Female'], ['Hendra Gunawan', 'Male'], ['Intan Permata', 'Female'], ['Yusuf Maulana', 'Male'],
  ['Anisa Fitri', 'Female'], ['Galih Pangestu', 'Male'], ['Rina Marlina', 'Female'], ['Taufik Hidayah', 'Male'],
];
export const students: Student[] = studentSeed.map(([name, gender], i) => ({
  studentId: `2016${String(i + 1).padStart(4, '0')}`,
  name,
  gender,
  address: 'Jl. Merdeka No. ' + (i + 1) + ', Cirebon',
  dateOfBirth: `${2000 + (i % 3)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
  phoneNumber: `0857000${String(i + 1).padStart(4, '0')}`,
  photo: null,
}));

// 4 siswa per kelas
export const detailClasses: DetailClass[] = students.map((s, i) => ({
  detailClassId: i + 1,
  className: classes[Math.floor(i / 4)].className,
  studentId: s.studentId,
}));

// XIIA & XIIB belum difinalisasi (finalize = 0)
export const headerSchedules: HeaderSchedule[] = classes.map((c, i) => ({
  scheduleId: i + 1,
  className: c.className,
  finalize: i < 4 ? 1 : 0,
}));

function teacherFor(subject: Subject, ci: number): string {
  const candidates = expertise.filter((e) => e.subjectId === subject.subjectId);
  return candidates[ci % candidates.length].teacherId;
}

export const detailSchedules: DetailSchedule[] = classes
  .flatMap((c, ci) =>
    subjects
      .filter((s) => s.grade === c.grade)
      .map((s, si) => ({
        scheduleId: ci + 1,
        subjectId: s.subjectId,
        teacherId: teacherFor(s, ci),
        shiftId: 1 + ((ci * 3 + si * 2) % 8),
        day: DAYS[(ci + si) % 5],
      }))
  )
  .map((d, i) => ({ detailId: i + 1, ...d }));

// Pseudo-random deterministik (aman untuk SSR / tidak hydration mismatch)
function rand(seed: number, min = 55, max = 98) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return Math.round(min + (x - Math.floor(x)) * (max - min));
}

export const detailScores: DetailScore[] = detailClasses
  .flatMap((dc) =>
    detailSchedules
      .filter((d) => headerSchedules.find((h) => h.scheduleId === d.scheduleId)?.className === dc.className)
      .map((d) => ({ detailId: d.detailId, studentId: dc.studentId }))
  )
  .map((r, i) => ({
    scoreDetailId: i + 1,
    ...r,
    assignment: rand(i * 3 + 1),
    midExam: rand(i * 3 + 2),
    finalExam: rand(i * 3 + 3),
  }));

// ---------- Helper turunan (join antar tabel) ----------
export const getSubject = (id: string) => subjects.find((s) => s.subjectId === id)!;
export const getTeacher = (id: string) => teachers.find((t) => t.teacherId === id)!;
export const getShift = (id: number) => shifts.find((s) => s.shiftId === id)!;

export function finalScore(score: DetailScore, subject: Subject): number {
  const v =
    ((score.assignment ?? 0) * subject.assignment +
      (score.midExam ?? 0) * subject.midExam +
      (score.finalExam ?? 0) * subject.finalExam) / 100;
  return Math.round(v * 10) / 10;
}

type ScoreRow = DetailScore & { final: number; subject: Subject; className: string; grade: number };
export const scoreRows: ScoreRow[] = detailScores.map((sc) => {
  const detail = detailSchedules.find((d) => d.detailId === sc.detailId)!;
  const subject = getSubject(detail.subjectId);
  const className = headerSchedules.find((h) => h.scheduleId === detail.scheduleId)!.className;
  return { ...sc, subject, className, grade: subject.grade, final: finalScore(sc, subject) };
});

const avg = (n: number[]) => (n.length ? Math.round((n.reduce((a, b) => a + b, 0) / n.length) * 10) / 10 : 0);

/** Data chart "Report Score": rata-rata nilai akhir per tingkat (X/XI/XII), kelas A vs B. */
export function reportScore(subjectName: string) {
  const rows = scoreRows.filter((r) => r.subject.name === subjectName);
  const pick = (grade: number, suffix: 'A' | 'B') =>
    avg(rows.filter((r) => r.grade === grade && r.className.endsWith(suffix)).map((r) => r.final));
  return {
    chart: [
      { grade: 'X', classA: pick(10, 'A'), classB: pick(10, 'B') },
      { grade: 'XI', classA: pick(11, 'A'), classB: pick(11, 'B') },
      { grade: 'XII', classA: pick(12, 'A'), classB: pick(12, 'B') },
    ],
    passedPercentage: rows.length
      ? Math.round((rows.filter((r) => r.final >= PASSING_SCORE).length / rows.length) * 100)
      : 0,
  };
}
export const subjectOptions = subjectNames;

/** Jumlah sesi mengajar per hari, dipisah finalized vs draft. */
export function sessionsPerDay() {
  return DAYS.map((day) => {
    const list = detailSchedules.filter((d) => d.day === day);
    const isFinal = (d: DetailSchedule) =>
      headerSchedules.find((h) => h.scheduleId === d.scheduleId)?.finalize === 1;
    return { day: day.slice(0, 3), finalized: list.filter(isFinal).length, draft: list.filter((d) => !isFinal(d)).length };
  });
}

export function dashboardStats() {
  const finalized = headerSchedules.filter((h) => h.finalize === 1).length;
  return {
    students: students.length,
    male: students.filter((s) => s.gender === 'Male').length,
    female: students.filter((s) => s.gender === 'Female').length,
    teachers: teachers.length,
    classes: classes.length,
    subjects: subjects.length,
    finalized,
    schedules: headerSchedules.length,
    avgFinal: avg(scoreRows.map((r) => r.final)),
    passRate: Math.round((scoreRows.filter((r) => r.final >= PASSING_SCORE).length / scoreRows.length) * 100),
  };
}

export function studentSummaries() {
  return students.map((s) => {
    const rows = scoreRows.filter((r) => r.studentId === s.studentId);
    const className = detailClasses.find((d) => d.studentId === s.studentId)!.className;
    const final = avg(rows.map((r) => r.final));
    return {
      studentId: s.studentId,
      name: s.name,
      gender: s.gender,
      className,
      assignment: avg(rows.map((r) => r.assignment ?? 0)),
      midExam: avg(rows.map((r) => r.midExam ?? 0)),
      finalExam: avg(rows.map((r) => r.finalExam ?? 0)),
      final,
      passed: final >= PASSING_SCORE,
    };
  });
}

export function scheduleFor(className: string) {
  const header = headerSchedules.find((h) => h.className === className)!;
  return {
    finalized: header.finalize === 1,
    rows: detailSchedules
      .filter((d) => d.scheduleId === header.scheduleId)
      .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.shiftId - b.shiftId)
      .map((d) => ({
        detailId: d.detailId,
        day: d.day,
        time: getShift(d.shiftId).time,
        subjectId: d.subjectId,
        subject: getSubject(d.subjectId).name,
        teacherId: d.teacherId,
        teacher: getTeacher(d.teacherId).name,
      })),
  };
}

export function teacherSummaries() {
  return teachers.map((t) => ({
    ...t,
    subjects: [...new Set(expertise.filter((e) => e.teacherId === t.teacherId).map((e) => getSubject(e.subjectId).name))],
    sessions: detailSchedules.filter((d) => d.teacherId === t.teacherId).length,
  }));
}
