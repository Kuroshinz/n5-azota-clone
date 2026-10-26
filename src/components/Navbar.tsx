'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  PlusCircle,
  Home,
  ListFilter,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  Settings,
  ChevronDown,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  examTitle?: string;
  showLinks?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ examTitle, showLinks = true }) => {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2 sm:py-2.5">
        {/* Left: Brand & Home */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 group transition"
            title="Trang chủ N5Exam"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-indigo-900 group-hover:text-indigo-600 transition">
                N5EXAM
              </span>
              <span className="hidden xs:inline-block ml-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100">
                GDPT 2018
              </span>
            </div>
          </Link>

          {examTitle && (
            <div className="hidden md:flex items-center gap-2 border-l border-gray-200 pl-4 text-xs text-gray-500">
              <span className="font-semibold text-gray-700 truncate max-w-xs">{examTitle}</span>
            </div>
          )}
        </div>

        {/* Right: Quick Navigation & User Profile */}
        {showLinks && (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                pathname === '/'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>

            <Link
              href="/teacher/exams"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                pathname.startsWith('/teacher/exams')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <ListFilter className="h-4 w-4" />
              <span>Quản lý đề</span>
            </Link>

            <Link
              href="/teacher/create"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Tạo đề mới</span>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                  pathname.startsWith('/admin')
                    ? 'bg-purple-600 text-white shadow-purple-200'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-current" />
                <span>Admin</span>
              </Link>
            )}

            {/* User Profile / Settings Dropdown */}
            <div className="border-l border-gray-200 pl-2 sm:pl-3 ml-1 flex items-center gap-2" ref={dropdownRef}>
              {loading ? (
                <div className="h-8 w-20 bg-gray-100 animate-pulse rounded-xl" />
              ) : user ? (
                <div className="relative">
                  {/* Dropdown Trigger */}
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/90 rounded-xl px-2.5 py-1 transition cursor-pointer select-none"
                    title="Menu tài khoản"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-xs uppercase shadow-xs">
                      {user.fullName.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-gray-800 max-w-[80px] sm:max-w-[130px] truncate">
                      {user.fullName}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-gray-200 shadow-xl shadow-gray-200/50 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-sm uppercase shadow-sm">
                            {user.fullName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.fullName}</p>
                            <p className="text-xs text-gray-500 truncate">{user.phone}</p>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between">
                          {user.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="h-3 w-3" />
                              Quản trị viên
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                              <UserCheck className="h-3 w-3" />
                              {user.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400">Đang hoạt động</span>
                        </div>
                      </div>

                      {/* Links */}
                      <div className="py-1">
                        <Link
                          href="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition ${
                            pathname === '/settings'
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Settings className="h-4 w-4 text-gray-400" />
                          <span>Cài đặt & Hồ sơ</span>
                        </Link>

                        {user.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition ${
                              pathname.startsWith('/admin')
                                ? 'bg-purple-50 text-purple-700 font-bold'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <ShieldAlert className="h-4 w-4 text-purple-500" />
                            <span>Bảng quản trị hệ thống</span>
                          </Link>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100 my-1" />

                      {/* Logout */}
                      <div className="px-2 py-1">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/login${pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : ''}`}
                    className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Đăng nhập</span>
                  </Link>
                  <Link
                    href={`/register${pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : ''}`}
                    className="hidden sm:inline-flex rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-gray-800 transition"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
