import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Azota - Nền tảng tạo đề thi và bài tập online',
  description: 'Hệ thống giám sát thi trực tuyến, nhận diện toán học KaTeX và chấm thi tự động.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-indigo-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
