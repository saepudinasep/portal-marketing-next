export type NotificationType = 'schedule' | 'score' | 'class' | 'account' | 'system';

export type AppNotification = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  read: boolean;
};

// Data dummy. ERD tidak punya tabel notifikasi, jadi nanti perlu tabel baru
// (mis. Notification: id, userId, type, title, message, createdAt, readAt).
export const initialNotifications: AppNotification[] = [
  { id: 1, type: 'schedule', title: 'Schedule finalized', message: 'The schedule for class XA has been finalized.', date: '2026-10-06', time: '09:15', read: false },
  { id: 2, type: 'score', title: 'Scores submitted', message: 'Scores for Informatika (XIA) were entered by Siti Rahmawati.', date: '2026-10-06', time: '08:40', read: false },
  { id: 3, type: 'class', title: 'Student assigned to class', message: 'Salsa Amelia was added to class XB.', date: '2026-10-05', time: '15:20', read: false },
  { id: 4, type: 'account', title: 'Password changed', message: 'Your password was changed successfully.', date: '2026-10-05', time: '10:02', read: true },
  { id: 5, type: 'schedule', title: 'Schedule updated', message: 'Matematika on Tuesday for XIIA moved to shift 3.', date: '2026-10-04', time: '13:45', read: false },
  { id: 6, type: 'system', title: 'Welcome to SMK Nusantara', message: 'Your account has been created. Complete your profile in Account.', date: '2026-10-01', time: '07:00', read: true },
  { id: 7, type: 'score', title: 'Report score available', message: 'The average score report for Agama is ready to view.', date: '2026-09-30', time: '16:10', read: true },
  { id: 8, type: 'class', title: 'Class roster updated', message: '4 students are still waiting for a class.', date: '2026-09-29', time: '11:30', read: true },
  { id: 9, type: 'schedule', title: 'New teaching session', message: 'You have a new session: Agama, XIB, Thursday 07:45 - 08:30.', date: '2026-09-28', time: '09:00', read: true },
  { id: 10, type: 'system', title: 'Maintenance notice', message: 'The portal will be unavailable on Sunday 02:00 - 03:00.', date: '2026-09-27', time: '18:00', read: true },
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format manual (tanpa Intl/zona waktu) supaya hasil server dan client selalu sama. */
export function formatDateTime(date: string, time: string) {
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${months[m - 1]} ${y} · ${time}`;
}
