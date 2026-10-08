export type RoleName = 'admin' | 'teacher' | 'student';

/**
 * TODO (tahap login): ganti isi fungsi ini dengan `auth()` dari Auth.js, lalu
 * lempar error / redirect bila belum login atau perannya tidak termasuk `roles`.
 *
 * PERINGATAN: selama fungsi ini belum diisi, Server Actions bisa dipanggil siapa saja.
 * Jangan deploy ke internet sebelum tahap login selesai.
 */
export async function requireRole(...roles: RoleName[]): Promise<void> {
  void roles;
}
