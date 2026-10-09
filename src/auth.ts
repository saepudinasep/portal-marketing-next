import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { authConfig } from '@/auth.config';
import { authorizeCredentials, loadSessionProfile } from '@/lib/authorize';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      const token = authConfig.callbacks.jwt(params);
      // useSession().update() tanpa argumen: nama & foto dibaca ulang dari database,
      // sehingga klien tidak bisa menyisipkan nilai sendiri ke sesinya.
      if (params.trigger === 'update') {
        const fresh = await loadSessionProfile(token.uid);
        if (fresh) {
          token.name = fresh.name;
          token.picture = fresh.image;
        }
      }
      return token;
    },
  },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      authorize: authorizeCredentials,
    }),
  ],
});
