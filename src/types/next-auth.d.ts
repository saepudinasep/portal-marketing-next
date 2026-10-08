import type { DefaultSession } from 'next-auth';

import type { RoleName } from '@/lib/access';

declare module 'next-auth' {
  interface User {
    role: RoleName;
    username: string;
  }
  interface Session {
    user: {
      id: string;
      role: RoleName;
      username: string;
    } & DefaultSession['user'];
  }
}

// Di Auth.js v5 interface JWT didefinisikan di @auth/core; 'next-auth/jwt' hanya mengekspor ulang.
// Dua-duanya diperluas agar tipe token benar di semua tempat.
declare module '@auth/core/jwt' {
  interface JWT {
    uid: string;
    role: RoleName;
    username: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid: string;
    role: RoleName;
    username: string;
  }
}
