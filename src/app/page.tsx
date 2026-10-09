import { redirect } from 'next/navigation';

// Proxy sudah mengalihkan '/' (ke /login atau halaman awal sesuai peran); ini hanya cadangan.
export default function Home() {
  redirect('/login');
}
