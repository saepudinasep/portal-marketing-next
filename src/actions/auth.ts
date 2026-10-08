'use server';

import { AuthError } from 'next-auth';

import { signIn, signOut } from '@/auth';
import { safeRedirect } from '@/lib/access';

/** Dipakai oleh useActionState di form login. Mengembalikan pesan error, atau redirect saat sukses. */
export async function login(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const callbackUrl = safeRedirect(String(formData.get('callbackUrl') ?? ''));

  try {
    await signIn('credentials', { username, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.type === 'CredentialsSignin'
        ? 'Username atau password salah. Silakan coba lagi.'
        : 'Something went wrong. Please try again.';
    }
    throw error; // redirect sukses dilempar sebagai error khusus Next.js, jangan ditelan
  }
}

export async function logout() {
  await signOut({ redirectTo: '/login' });
}
