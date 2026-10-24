'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Lock, Phone, User, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Vui lòng nhập họ và tên (tối thiểu 2 ký tự)');
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setError('Vui lòng nhập số điện thoại hợp lệ');
      return;
    }
    if (!password || password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setSubmitting(true);
    const result = await register({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      password
    });
    setSubmitting(false);

    if (result.success) {
      // Use window.location.href to perform a clean full page navigation
      window.location.href = redirectUrl;
    } else {
      setError(result.error || 'Đăng ký không thành công');
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
          <h1 className="text-xl font-bold text-gray-900 mt-2">Đăng ký tài khoản mới</h1>
          <p className="text-xs text-gray-500 mt-1">Tạo tài khoản để bắt đầu tạo đề thi hoặc tham gia phòng thi</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Họ và tên
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 pl-10 text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <User className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Số điện thoại
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0988776655"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 pl-10 text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Phone className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email (không bắt buộc)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ví dụ: hoten@gmail.com"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 pl-10 text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mật khẩu (tối thiểu 6 ký tự)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tạo mật khẩu..."
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 pl-10 text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Xác nhận lại mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 pl-10 text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang đăng ký...</span>
                </>
              ) : (
                <>
                  <span>Hoàn tất đăng ký</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-gray-500">
            Đã có tài khoản?{' '}
            <Link
              href={redirectUrl !== '/' ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
              className="font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
      <RegisterForm />
    </Suspense>
  );
}
