import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Hotaru Live ⚡ Antrean & Request Streamer',
  description:
    'Dasbor real-time interaktif untuk Hotaru Live dan Cosplayer. Kelola antrean lagu, fansign, PAP, dan cosplay dengan integrasi YouTube Auto-Player.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-[#FFFDF5] text-[#121212]" suppressHydrationWarning>{children}</body>
    </html>
  );
}
