'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, PlusCircle, Home, ListFilter, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  examTitle?: string;
  showLinks?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ examTitle, showLinks = true }) => {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2 sm:py-2.5">
        {/* Left: Brand & Home */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 group transition"
            title="Trang chủ Azota"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-indigo-900 group-hover:text-indigo-600 transition">
                AZOTA
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

            {/* User Profile or Auth buttons */}
            <div className="border-l border-gray-200 pl-2 sm:pl-3 ml-1 flex items-center gap-2">
              {loading ? (
                <div className="h-8 w-20 bg-gray-100 animate-pulse rounded-xl" />
              ) : user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 rounded-xl px-2.5 py-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs uppercase">
                      {user.fullName.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-gray-800 max-w-[75px] sm:max-w-[130px] truncate">
                      {user.fullName}
                    </span>
                  </div>
                  <button
                    onClick={() => logout()}
                    title="Đăng xuất"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
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
