import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/Providers';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';

export const metadata: Metadata = {
  title: 'N5Exam - Nền tảng Khảo thí & Luyện thi Trực tuyến GDPT 2018',
  description: 'Hệ thống giám sát thi trực tuyến, nhận diện toán học KaTeX và chấm thi tự động.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'N5Exam',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#4f46e5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-indigo-500 selection:text-white text-slate-800">
        <Providers>
          {children}
          <PwaInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
