import { teachers } from '@/lib/dummy-data';

// Pengguna yang sedang login (dummy). Nanti ganti dengan data dari sesi login.
// Field mengikuti tabel User: Username VARCHAR(8), Password VARCHAR(10), Role VARCHAR(8).
export const currentUser = {
  userId: 1,
  username: 'T0001',
  password: 'teacher01',
  role: 'Teacher',
  email: 'deren@smknusantara.sch.id',
  avatar: '',
};

/** Profil guru yang terhubung ke user ini (Teacher.TeacherID = User.Username). */
export const currentProfile = teachers.find((t) => t.teacherId === currentUser.username)!;
