import type { Metadata } from 'next';
import { AuthProvider } from '@/components/providers/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'مركز تميز - نظام إدارة المعاهد',
  description: 'نظام إدارة شامل للمعاهد الخاصة',
  icons: {
    icon: [],
    apple: [],
    shortcut: [],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

