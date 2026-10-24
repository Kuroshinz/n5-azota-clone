'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-slate-50">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm max-w-md w-full">
        <h2 className="text-xl font-bold text-rose-600 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-xs text-gray-500 mb-6">{error.message || 'Lỗi không xác định'}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
