/**
 * Membuat admin pertama TANPA menghapus data apa pun (aman untuk produksi).
 *
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD='Passw0rd!Kuat' npx tsx prisma/create-admin.ts
 *   (lokal: npm run db:create-admin, membaca .env)
 *
 * Menolak jika username sudah ada. Password harus memenuhi kebijakan (8+ karakter,
 * huruf besar, huruf kecil, angka, simbol).
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/lib/password';
import { passwordPolicy } from '../src/lib/validations';

const prisma = new PrismaClient();

async function main() {
  const username = (process.env.ADMIN_USERNAME ?? 'admin').trim();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const email = process.env.ADMIN_EMAIL?.trim() || null;

  if (!username || username.length > 32)
    throw new Error('ADMIN_USERNAME wajib diisi (maksimal 32 karakter).');
  const check = passwordPolicy.safeParse(password);
  if (!check.success)
    throw new Error(`ADMIN_PASSWORD tidak memenuhi kebijakan: ${check.error.issues[0].message}`);

  if (await prisma.user.findUnique({ where: { username } })) {
    throw new Error(`User "${username}" sudah ada. Tidak ada yang diubah.`);
  }

  await prisma.user.create({
    data: {
      username,
      email,
      role: 'admin',
      password: await hashPassword(password),
      mustChangePassword: false,
    },
  });
  console.log(`Admin "${username}" berhasil dibuat.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
