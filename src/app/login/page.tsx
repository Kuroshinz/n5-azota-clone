'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Lock, Phone, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Vui lòng nhập Số điện thoại hoặc Email');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setSubmitting(true);
    const result = await login(identifier.trim(), password);
    setSubmitting(false);

    if (result.success) {
      window.location.href = redirectUrl;
    } else {
      setError(result.error || 'Đăng nhập không thành công');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50/60 via-white to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 group-hover:scale-105 transition">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-indigo-950">AZOTA</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">Đăng nhập tài khoản</h1>
          <p className="text-xs text-gray-500 mt-1">Sử dụng để tạo đề, làm bài thi và lưu trữ kết quả học tập</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Số điện thoại hoặc Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ví dụ: 0988xxxxxx hoặc email@domain.com"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pl-10 text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pl-10 text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập ngay</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Chưa có tài khoản?{' '}
            <Link
              href={redirectUrl !== '/' ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
              className="font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Đăng ký tài khoản mới
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Đang tải...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
