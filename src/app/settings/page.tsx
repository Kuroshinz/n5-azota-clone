'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldCheck,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Laptop,
  Check,
  Lock,
  BadgeAlert,
  Smartphone
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

type TabType = 'profile' | 'security' | 'session';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, updateProfile, changePassword, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/settings');
    } else if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
    }
  }, [user, loading, router]);

  // Calculate password strength (0 to 3)
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setProfileError('Họ và tên phải có ít nhất 2 ký tự');
      return;
    }

    setProfileSaving(true);
    try {
      const res = await updateProfile({ fullName, email });
      if (res.success) {
        setProfileSuccess('Cập nhật hồ sơ cá nhân thành công!');
        setTimeout(() => setProfileSuccess(null), 4000);
      } else {
        setProfileError(res.error || 'Cập nhật thất bại');
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không trùng khớp');
      return;
    }
    if (oldPassword === newPassword) {
      setPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await changePassword({ oldPassword, newPassword });
      if (res.success) {
        setPasswordSuccess('Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 5000);
      } else {
        setPasswordError(res.error || 'Đổi mật khẩu thất bại');
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const roleBadge = () => {
    if (user.role === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          Quản trị viên (Admin)
        </span>
      );
    }
    if (user.role === 'TEACHER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <User className="w-3.5 h-3.5 text-blue-600" />
          Giáo viên
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <User className="w-3.5 h-3.5 text-emerald-600" />
        Học sinh / Thí sinh
      </span>
    );
  };

  const passStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Top Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/teacher/exams"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang quản lý</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              Cài đặt tài khoản
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                GDPT 2018
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Quản lý hồ sơ cá nhân, cập nhật mật khẩu và bảo mật phiên làm việc.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-200 transition flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Bảng quản trị</span>
              </Link>
            )}
            <button
              onClick={() => logout()}
              className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Navigation Sidebar (3 tabs) */}
          <div className="md:col-span-4 lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
            {/* User Mini Card */}
            <div className="p-3 mb-2 rounded-xl bg-gradient-to-br from-indigo-50 via-slate-50 to-white border border-indigo-100/60 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-100 uppercase">
                {user.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">{user.fullName}</h3>
                <p className="text-xs text-slate-500 truncate">{user.phone}</p>
                <div className="mt-1">{roleBadge()}</div>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Hồ sơ cá nhân</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Đổi mật khẩu & Bảo mật</span>
              </button>

              <button
                onClick={() => setActiveTab('session')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                  activeTab === 'session'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Phiên đăng nhập & Thiết bị</span>
              </button>
            </nav>

            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-pwa-install'))}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition border border-indigo-100 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span>Cài đặt Ứng dụng (App)</span>
              </button>
            </div>
          </div>

          {/* Main Tab Panel */}
          <div className="md:col-span-8 lg:col-span-9 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs">
            {/* TAB 1: PROFILE */}
            {activeTab === 'profile' && (
              <div>
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    Thông tin hồ sơ cá nhân
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Cập nhật họ tên hiển thị và email liên kết dùng cho nhận thông báo kết quả.
                  </p>
                </div>

                {profileSuccess && (
                  <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-bold text-rose-800 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-xl">
                  {/* Avatar section */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-indigo-100 uppercase">
                      {fullName ? fullName.charAt(0) : 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{fullName || 'Chưa đặt tên'}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Ảnh đại diện tự động theo ký tự đầu</p>
                      <div className="mt-1.5">{roleBadge()}</div>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Họ và tên hiển thị <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nhập họ và tên đầy đủ..."
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      />
                    </div>
                  </div>

                  {/* Phone (Readonly ID) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Số điện thoại đăng nhập
                      </label>
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã xác thực
                      </span>
                    </div>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={user.phone}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-not-allowed select-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Số điện thoại là mã định danh chính cho tài khoản N5Exam của bạn.
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@n5exam.vn"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="pt-2 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Tham gia: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Mặc định'}
                    </span>
                    <span>•</span>
                    <span>ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-700">{user.id}</code></span>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-indigo-100 transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {profileSaving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Lưu thay đổi hồ sơ</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: SECURITY & CHANGE PASSWORD */}
            {activeTab === 'security' && (
              <div>
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-indigo-600" />
                    Đổi mật khẩu tài khoản
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Bảo vệ an toàn tài khoản của bạn bằng mật khẩu mạnh và không chia sẻ cho người khác.
                  </p>
                </div>

                {passwordSuccess && (
                  <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-bold text-rose-800 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mật khẩu hiện tại <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showOldPass ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại..."
                        required
                        className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass(!showOldPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự..."
                        required
                        className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1.5 h-1.5 w-full">
                          <div className={`h-full flex-1 rounded-full ${passStrength >= 1 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                          <div className={`h-full flex-1 rounded-full ${passStrength >= 2 ? 'bg-blue-500' : 'bg-slate-200'}`} />
                          <div className={`h-full flex-1 rounded-full ${passStrength >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Độ mạnh: {passStrength === 1 ? 'Yếu (>= 6 ký tự)' : passStrength === 2 ? 'Khá (có số & chữ hoa)' : 'Rất mạnh (có ký tự đặc biệt)'}</span>
                          <span className="text-slate-400 font-mono">{newPassword.length} ký tự</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới..."
                        required
                        className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-indigo-100 transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {passwordSaving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang cập nhật...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Xác nhận đổi mật khẩu</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: SESSION & LOGOUT */}
            {activeTab === 'session' && (
              <div>
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Laptop className="w-5 h-5 text-indigo-600" />
                    Quản lý phiên làm việc & Đăng xuất
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Theo dõi trạng thái thiết bị và đăng xuất an toàn khỏi hệ thống N5Exam.
                  </p>
                </div>

                <div className="space-y-5 max-w-xl">
                  {/* Current Active Device Card */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          Thiết bị hiện tại
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Đang hoạt động
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Web Browser • Phiên đăng nhập cookie bảo mật 7 ngày
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Đăng nhập vào: {user.fullName} ({user.phone})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
                    <BadgeAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Khuyến cáo bảo mật tài khoản:</p>
                      <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                        Nếu bạn đang sử dụng máy tính công cộng hoặc thiết bị của người khác, hãy luôn bấm Đăng xuất khi kết thúc phiên làm bài để đảm bảo dữ liệu đề thi và kết quả không bị truy cập trái phép.
                      </p>
                    </div>
                  </div>

                  {/* Big Logout Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => logout()}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-rose-100 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất khỏi thiết bị này ngay</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
