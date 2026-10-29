'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Phone,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Steps: 1 = Enter Identifier, 2 = Enter OTP & New Password, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: 'Chưa nhập', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, text: 'Yếu', color: 'bg-rose-500 text-rose-600' };
    if (score <= 3) return { score: 2, text: 'Trung bình', color: 'bg-amber-500 text-amber-600' };
    return { score: 3, text: 'Mạnh', color: 'bg-emerald-500 text-emerald-600' };
  };

  const strength = getPasswordStrength(newPassword);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError('Vui lòng nhập số điện thoại hoặc email đã đăng ký');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_otp', identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedOtp(data.otp || null);
        setStep(2);
        setSuccessMsg('Đã tạo mã xác nhận thành công! Hãy nhập mã để đặt lại mật khẩu.');
      } else {
        setError(data.error || 'Không tìm thấy tài khoản tương ứng');
      }
    } catch (err: any) {
      setError('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim()) {
      setError('Vui lòng nhập mã xác thực OTP 6 chữ số');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          identifier: identifier.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(3);
      } else {
        setError(data.error || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.');
      }
    } catch (err: any) {
      setError('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyOtpToInput = () => {
    if (generatedOtp) {
      setOtp(generatedOtp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs">
              <KeyRound className="h-7 w-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Khôi phục mật khẩu
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Lấy lại quyền truy cập tài khoản N5Exam nhanh chóng và bảo mật
            </p>

            {/* Stepper Dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  step === 1 ? 'w-8 bg-indigo-600' : 'w-2 bg-indigo-200'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all ${
                  step === 2 ? 'w-8 bg-indigo-600' : 'w-2 bg-indigo-200'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all ${
                  step === 3 ? 'w-8 bg-emerald-600' : 'w-2 bg-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Alert messages */}
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && step === 2 && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Identifier */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Số điện thoại hoặc Email đăng ký
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Ví dụ: 0988xxxxxx hoặc email@domain.com"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pl-10 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Nhập chính xác số điện thoại hoặc email bạn đã dùng để đăng ký tài khoản.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-98 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang kiểm tra tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Tiếp tục lấy mã OTP</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Demo Helper Badge for Zero-Telecom Testing */}
              {generatedOtp && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Mã xác thực an toàn:
                    </span>
                    <button
                      type="button"
                      onClick={copyOtpToInput}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 font-bold text-[11px] hover:bg-indigo-100 transition cursor-pointer"
                    >
                      {copiedOtp ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedOtp ? 'Đã điền mã' : 'Tự động điền mã'}</span>
                    </button>
                  </div>
                  <div className="mt-1 font-mono font-black text-lg tracking-widest text-indigo-700 text-center bg-white py-1.5 rounded-xl border border-indigo-100 shadow-2xs">
                    {generatedOtp}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mã xác thực OTP (6 chữ số)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/D/g, ''))}
                  placeholder="Nhập 6 số mã xác nhận..."
                  className="w-full text-center font-mono tracking-widest text-base font-bold rounded-xl border border-slate-200 py-2.5 text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-normal placeholder:text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Mật khẩu mới
                  </label>
                  {newPassword && (
                    <span className={`text-[10px] font-bold ${strength.color}`}>
                      Độ mạnh: {strength.text}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pl-10 pr-10 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pl-10 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <span>Đổi mật khẩu ngay</span>
                      <ShieldCheck className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Khôi phục mật khẩu thành công!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Mật khẩu tài khoản của bạn đã được cập nhật an toàn. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href={`/login`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-98 transition"
                >
                  <span>Đăng nhập ngay</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Footer Back to Login */}
          {step !== 3 && (
            <div className="mt-6 text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
              Nhớ mật khẩu?{' '}
              <Link
                href="/login"
                className="font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                Quay lại Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
