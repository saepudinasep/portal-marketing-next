// Aturan akses per peran. File ini murni (tanpa Prisma/bcrypt) sehingga aman dipakai
// di proxy.ts, di server, maupun di komponen client (mis. untuk menyaring menu sidebar).

export type RoleName = 'admin' | 'teacher' | 'student';

/** Halaman awal setelah login, sesuai Navigation Diagram di soal. */
export const ROLE_HOME: Record<RoleName, string> = {
  admin: '/dashboard',
  teacher: '/teacher-schedule',
  student: '/class-schedule',
};

const COMMON = ['/account', '/notifications'];

// Awalan path yang boleh dibuka tiap peran.
const ACCESS: Record<RoleName, string[]> = {
  admin: [
    '/dashboard',
    '/manage-student',
    '/manage-teacher',
    '/manage-class',
    '/manage-schedule',
    '/finalize-schedule',
    '/view-report-score',
    ...COMMON,
  ],
  teacher: ['/teacher-schedule', '/input-score', ...COMMON],
  student: ['/class-schedule', '/view-score', ...COMMON],
};

export function canAccess(role: RoleName | undefined, pathname: string): boolean {
  if (!role) return false;
  return ACCESS[role].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Menyaring daftar menu sidebar sesuai peran. Item harus punya properti `url`. */
export function filterNavByRole<T extends { url: string }>(
  role: RoleName | undefined,
  items: T[],
): T[] {
  return items.filter((item) => canAccess(role, item.url));
}

/**
 * Mengubah callbackUrl menjadi path internal yang aman. Auth.js mengirimnya sebagai URL absolut
 * (mis. http://localhost:3000/dashboard); yang diambil hanya path + query-nya, host DIABAIKAN,
 * jadi tidak mungkin diarahkan ke situs luar (open redirect).
 */
export function safeRedirect(value: string | null | undefined): string {
  if (!value) return '/';
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      path = url.pathname + url.search;
    } catch {
      return '/';
    }
  }
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.startsWith('/\\') ||
    path.startsWith('/login')
  )
    return '/';
  return path;
}
