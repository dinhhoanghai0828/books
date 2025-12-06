'use client';
import HeaderComponent from '@/components/Header/HeaderComponent';
import './globals.css';
import { usePathname } from 'next/navigation';
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname(); // Lấy đường dẫn hiện tại
  // Kiểm tra nếu không phải trang cần header
  const shouldShowHeader = pathname !== '/login';
  return (
    <html lang="en">
      {/* <body className={`${geistSans.variable} ${geistMono.variable}`}> */}
      <body>
        {/* Hiển thị header nếu không phải trang login */}
        {shouldShowHeader && <HeaderComponent />}
        {children}
      </body>
    </html>
  );
}
