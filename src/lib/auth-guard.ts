import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import type { RoleName } from '@/lib/access';

export type { RoleName };

/** Pastikan sudah login (peran apa pun). Dipakai untuk aksi akun sendiri, mis. ganti password. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session.user;
}

/**
 * Pastikan pengguna sudah login, tidak sedang memakai password sementara, dan perannya termasuk `roles`.
 * Panggil di setiap Server Action dan fungsi pengambilan data: proxy.ts saja tidak cukup,
 * karena Server Action bisa dipanggil langsung tanpa membuka halamannya.
 */
export async function requireRole(...roles: RoleName[]) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect('/account');
  if (!roles.includes(user.role)) throw new Error('Forbidden');
  return user;
}
