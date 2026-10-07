import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
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
// Contoh: export const metadata = { title: "Manage Student" }  ->  "Manage Student | SMK Nusantara"
export const metadata: Metadata = {
  title: {
    default: 'SMK Nusantara',
    template: '%s | SMK Nusantara',
  },
  description:
    'SMK Nusantara information system: students, teachers, classes, schedules and scores.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='en' className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col'>
        <RouteProgress />
        {children}
      </body>
    </html>
  );
}
