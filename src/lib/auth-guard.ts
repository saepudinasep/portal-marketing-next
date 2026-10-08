import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import type { RoleName } from '@/lib/access';

export type { RoleName };

/**
 * Pastikan pengguna sudah login dan perannya termasuk `roles`.
 * Panggil di setiap Server Action dan fungsi pengambilan data: proxy.ts saja tidak cukup,
 * karena Server Action bisa dipanggil langsung tanpa membuka halamannya.
 */
export async function requireRole(...roles: RoleName[]) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!roles.includes(session.user.role)) throw new Error('Forbidden');
  return session.user;
}
