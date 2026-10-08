import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { auth } from '@/auth';
import { RouteProgress } from '@/components/route-progress';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Judul tab dinamis: setiap page mengisi `title`, template menambahkan nama aplikasi.
// Contoh: export const metadata = { title: "Manage Student" }  ->  "Manage Student | Portal Marketing"
export const metadata: Metadata = {
  title: {
    default: 'Portal Marketing',
    template: '%s | Portal Marketing',
  },
  description:
    'SMK Nusantara information system: students, teachers, classes, schedules and scores.',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  // Sesi dibaca di server lalu dioper ke SessionProvider, jadi useSession() langsung terisi (tanpa kedip).
  const session = await auth();

  return (
    <html lang='en' className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col'>
        <SessionProvider session={session}>
          <RouteProgress />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
