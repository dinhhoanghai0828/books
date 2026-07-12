'use client';
import Header from '@/components/common/Header/Header';
import { usePathname } from 'next/navigation';
import './globals.css';

// ============================================================
// ROOT LAYOUT
// Layout chinh cua ung dung, quan ly header va cac trang con
// ============================================================

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  // An header tren trang login
  const showHeader = pathname !== '/login';

  return (
    <html lang="en">
      <body>
        {showHeader && <Header />}
        {children}
      </body>
    </html>
  );
}
