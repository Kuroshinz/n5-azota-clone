import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-slate-50">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm max-w-md w-full">
        <h2 className="text-4xl font-black text-indigo-600 mb-2">404</h2>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Không tìm thấy trang</h3>
        <p className="text-xs text-gray-500 mb-6">
          Trang bạn tìm kiếm không tồn tại hoặc đã được chuyển sang đường dẫn khác.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition"
        >
          Về trang chủ N5Exam
        </Link>
      </div>
    </div>
  );
}
