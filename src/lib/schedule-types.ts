export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
export type Day = (typeof DAYS)[number];

export const GRADE_LABEL: Record<number, string> = { 10: 'X', 11: 'XI', 12: 'XII' };

export type ClassInfo = { className: string; grade: number };
export type ClassStudent = { studentId: string; name: string; gender: 'Male' | 'Female' };

export type SubjectInfo = { subjectId: string; name: string; grade: number };
/** subjectIds = keahlian guru (tabel Expertise) */
export type TeacherInfo = { teacherId: string; name: string; subjectIds: string[] };
export type ShiftInfo = { shiftId: number; time: string };

/** Satu sesi jadwal (DetailSchedule). `id` = ObjectId; kode lainnya mengikuti ERD (S1001, T0001, XA). */
export type SessionDTO = {
  id: string;
  className: string;
  day: Day;
  subjectId: string;
  teacherId: string;
  shiftId: number;
};

export type ScheduleClass = ClassInfo & { finalized: boolean };

export type ScheduleBundle = {
  classes: ScheduleClass[];
  subjects: SubjectInfo[];
  teachers: TeacherInfo[];
  shifts: ShiftInfo[];
  sessions: SessionDTO[];
};

export type ManageClassData = {
  classes: ClassInfo[];
  students: ClassStudent[];
  /** studentId -> className (siswa tanpa kelas tidak ada di sini) */
  assignments: Record<string, string>;
};
