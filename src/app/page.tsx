'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Users,
  CheckCircle,
  Eye,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-100 text-slate-800">
      {/* Navbar */}
      <header className="border-b border-indigo-100/60 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 font-extrabold text-white shadow-md shadow-indigo-200">
              A
            </span>
            <div>
              <span className="text-xl font-black tracking-tight text-indigo-950">Azota</span>
              <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                Clone Pro
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/teacher/exams"
              className="text-xs font-semibold text-gray-600 hover:text-indigo-600 transition"
            >
              Quản lý đề thi
            </Link>
            <Link
              href="/teacher/create"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition"
            >
              Tạo đề thi mới
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-6xl px-6 py-16 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-800 mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>Hệ thống tạo đề tự động & Giám sát thi chống gian lận thông minh</span>
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
          Nền tảng thi cử và chấm điểm trực tuyến chuẩn <span className="text-indigo-600">Azota</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 leading-relaxed">
          Nhận diện đề thi tiếng Việt tự động, render công thức toán học KaTeX mượt mà, giám sát thí sinh rời tab / thoát toàn màn hình và tự động chấm điểm theo thời gian thực.
        </p>

        {/* Feature Cards Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 text-left">
          {/* Card 1: For Teachers */}
          <div className="group rounded-3xl border border-indigo-100 bg-white p-8 shadow-xl shadow-indigo-100/50 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-200/50">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition">
              <GraduationCap className="h-8 w-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">Dành cho Giáo viên</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Dán đề thi văn bản dạng thô hoặc Word, hệ thống tự động nhận diện câu hỏi, các đáp án A/B/C/D, bảng đáp án và giải thích chi tiết kèm công thức LaTeX.
            </p>

            <div className="space-y-2.5 mb-8 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Nhận diện regex tiếng Việt chuẩn xác</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Quản lý danh sách bài nộp và phổ điểm</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Nhật ký gian lận chi tiết từng giây</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/teacher/create"
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition"
              >
                <span>Tạo đề mới ngay</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/teacher/exams"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Danh sách đề thi
              </Link>
            </div>
          </div>

          {/* Card 2: For Students */}
          <div className="group rounded-3xl border border-indigo-100 bg-white p-8 shadow-xl shadow-indigo-100/50 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-200/50">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">Dành cho Học sinh</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Trải nghiệm phòng thi trực tuyến tập trung cao độ với đồng hồ đếm ngược, tự động lưu bài làm liên tục và công nghệ giám sát chống gian lận.
            </p>

            <div className="space-y-2.5 mb-8 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Bật chế độ Toàn màn hình (Fullscreen)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Tự động lưu bài làm chống mất dữ liệu</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Xem ngay điểm số và lời giải chi tiết sau khi nộp</span>
              </div>
            </div>

            <Link
              href="/exam/sample-exam-1"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-emerald-700 transition"
            >
              <span>Vào thi thử nghiệm ngay</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
