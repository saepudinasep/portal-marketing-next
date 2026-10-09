import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth-guard';
import type { RoleName } from '@/lib/access';
import { cloudinaryReady } from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';

export type AccountProfile = {
  role: RoleName;
  /** username = kode guru/siswa (TeacherID / StudentID) atau username admin */
  code: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  photo: string | null;
  /** false bila kunci Cloudinary belum diisi: tombol unggah foto disembunyikan */
  photoEnabled: boolean;
};

export async function getAccountData(): Promise<AccountProfile> {
  const session = await requireUser(); // boleh dibuka saat password sementara (untuk menggantinya)

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { teacher: true, student: true },
  });
  if (!user) redirect('/login');

  const profile = user.teacher ?? user.student;
  return {
    role: user.role,
    code: user.username,
    name: profile?.name ?? 'Administrator',
    email: user.email ?? '',
    phoneNumber: profile?.phoneNumber ?? '',
    address: profile?.address ?? '',
    photo: profile?.photo ?? user.photo,
    photoEnabled: cloudinaryReady(),
  };
}
