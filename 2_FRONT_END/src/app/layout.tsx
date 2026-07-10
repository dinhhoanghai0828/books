'use client';
import HeaderComponent from '@/components/Header/HeaderComponent';
import { usePathname } from 'next/navigation';
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  // An header tren trang login
  const showHeader = pathname !== '/login';

  return (
    <html lang="en">
      <body>
        {showHeader && <HeaderComponent />}
        {children}
      </body>
    </html>
  );
}
