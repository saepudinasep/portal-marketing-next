import { compare } from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const credentialsSchema = z.object({
  username: z.string().trim().min(1).max(32),
  password: z.string().min(1).max(72), // batas input bcrypt
});

// Hash bcrypt "palsu": dipakai agar waktu respons sama baik username ada maupun tidak
// (mempersulit penebakan username lewat selisih waktu).
const DUMMY_HASH = '$2b$10$oSjq1sgjEA25IBEcqfQcRuMu4MBi0iyPykZZOHLlXgym7UhRCx1kS';

/** Memeriksa username + password. Mengembalikan data user untuk sesi, atau null bila gagal. */
export async function authorizeCredentials(raw: unknown) {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      teacher: { select: { name: true, photo: true } },
      student: { select: { name: true, photo: true } },
    },
  });

  const valid = await compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !user.isActive || !valid) return null;

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    name: user.teacher?.name ?? user.student?.name ?? 'Administrator',
    email: user.email,
    image: user.teacher?.photo ?? user.student?.photo ?? user.photo,
  };
}
