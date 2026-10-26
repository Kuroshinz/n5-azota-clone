'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Exam, Submission } from '../types/exam';
import { Navbar } from '../components/Navbar';
import {
  BookOpen,
  Search,
  Clock,
  HelpCircle,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Shield,
  Shuffle,
  Sparkles,
  ArrowRight,
  GraduationCap,
  History,
  Check,
  Filter,
  FileText,
  RotateCcw,
  Eye,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
  PlusCircle,
  Globe,
  Lock,
  Edit3,
  Users,
  User,
  Plus,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'public' | 'private'>('all');
  const [examCodeInput, setExamCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'my_exams' | 'history'>('my_exams');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync exams and past submissions from authenticated server
  useEffect(() => {
    setIsLoading(true);

    // 1. Fetch only current user's exams
    const fetchExams = fetch('/api/exams')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.exams)) {
          setExams(data.exams);
        }
      })
      .catch((err) => console.warn('Could not fetch user exams', err));

    // 2. Fetch only current user's own submission history
    const fetchHistory = fetch('/api/submissions?myHistory=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.submissions)) {
          setSubmissions(data.submissions);
        }
      })
      .catch((err) => console.warn('Could not fetch user submission history', err));

    Promise.all([fetchExams, fetchHistory]).finally(() => setIsLoading(false));
  }, []);

  // Filtered and searched exams
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchQuery =
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchQuery) return false;

      if (selectedFilter === 'public') {
        return exam.isPublic !== false;
      }
      if (selectedFilter === 'private') {
        return exam.isPublic === false;
      }

      return true;
    });
  }, [exams, searchQuery, selectedFilter]);

  const handleCopyLink = (examId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/exam/${examId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(examId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEnterCode = (e: React.FormEvent) => {
    e.preventDefault();
    let code = examCodeInput.trim();
    if (!code) return;

    // Handle full URL pasted into the input
    if (code.includes('/exam/')) {
      const parts = code.split('/exam/');
      code = parts[parts.length - 1].split('?')[0].split('#')[0];
    }

    router.push(`/exam/${code}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-20">
      {/* Universal Top Navigation */}
      <Navbar />

      {/* Hero Banner with Quick Code Entry */}
      <div className="border-b border-indigo-100/80 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white py-10 px-4 sm:px-6 shadow-md">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Column: Heading & Info */}
            <div className="md:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-700/60 border border-indigo-500/40 px-3 py-1 text-xs font-semibold text-indigo-200">
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                <span>Nền tảng Khảo thí & Luyện thi Trực tuyến Chuẩn GDPT 2018</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                {user ? `Xin chào, ${user.fullName}!` : 'Không gian làm bài thi & Kiểm tra'}
                <br />
                <span className="text-indigo-300 font-semibold text-xl sm:text-2xl">
                  Bảo mật tài khoản - Phân quyền riêng biệt
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed max-w-xl">
                Tự do tạo đề thi của riêng bạn, chia sẻ công khai cho học sinh làm bài hoặc dán mã đề từ người khác để vào thi ngay lập tức.
              </p>
            </div>

            {/* Right Column: Direct Exam Code Input Box */}
            <div className="md:col-span-5">
              <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/20 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">
                  <Play className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                  <span>Vào phòng thi nhanh bằng mã đề hoặc link</span>
                </div>
                <form onSubmit={handleEnterCode} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Dán mã đề hoặc link đề thi..."
                      value={examCodeInput}
                      onChange={(e) => setExamCodeInput(e.target.value)}
                      className="w-full rounded-xl border border-white/30 bg-white/95 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-amber-600 hover:to-amber-700 active:scale-98 transition cursor-pointer"
                  >
                    <span>Vào làm bài ngay</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
                <p className="text-[11px] text-indigo-200/80 mt-2 text-center">
                  Dán link phòng thi do người khác chia sẻ để làm bài
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        {/* Navigation Tabs & Header Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('my_exams')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'my_exams'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Đề thi của tôi ({exams.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Lịch sử làm bài của tôi ({submissions.length})</span>
            </button>
          </div>

          {/* Action Button: Create New Exam */}
          <div className="flex items-center gap-2">
            <Link
              href="/teacher/create"
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo đề thi mới</span>
            </Link>
          </div>
        </div>

        {/* TAB 1: MY EXAMS (ĐỀ THI CỦA TÔI) */}
        {activeTab === 'my_exams' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên đề thi hoặc mã đề..."
                  className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-4 text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedFilter('all')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shrink-0 cursor-pointer ${
                    selectedFilter === 'all'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tất cả ({exams.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('public')}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition shrink-0 cursor-pointer ${
                    selectedFilter === 'public'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Globe className="h-3 w-3" />
                  <span>Công khai (Public)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('private')}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition shrink-0 cursor-pointer ${
                    selectedFilter === 'private'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Lock className="h-3 w-3" />
                  <span>Riêng tư</span>
                </button>
              </div>
            </div>

            {/* Exam Cards Grid */}
            {filteredExams.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-xs">
                <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-800 mb-1">
                  {searchQuery ? 'Không tìm thấy đề thi phù hợp' : 'Bạn chưa tạo đề thi nào'}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                  {searchQuery
                    ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh sách.'
                    : 'Hãy tạo đề thi đầu tiên của bạn bằng cách tải file Word hoặc soạn câu hỏi.'}
                </p>
                <Link
                  href="/teacher/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Tạo đề thi mới ngay</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredExams.map((exam) => {
                  const isProctored = exam.settings?.enableProctoring;
                  const totalQ = exam.questions?.length || exam.totalQuestions || 0;
                  const isPublic = exam.isPublic !== false;

                  return (
                    <div
                      key={exam.id}
                      className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="font-mono text-[11px] font-semibold text-gray-400 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                            {exam.id}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isPublic ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                <Globe className="h-3 w-3" />
                                Công khai
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                                <Lock className="h-3 w-3" />
                                Riêng tư
                              </span>
                            )}

                            {isProctored && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200">
                                <Shield className="h-3 w-3" />
                                Giám sát
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition leading-snug line-clamp-2 mb-3">
                          {exam.title}
                        </h3>

                        {/* Exam Specs */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4">
                          <div className="flex items-center gap-1.5">
                            <HelpCircle className="h-3.5 w-3.5 text-indigo-500" />
                            <span>{totalQ} câu hỏi</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                            <span>{exam.durationMinutes || 45} phút</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              {exam.createdAt
                                ? new Date(exam.createdAt).toLocaleDateString('vi-VN')
                                : 'Hôm nay'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-indigo-600" />
                            <span className="font-semibold text-indigo-700">{exam.submissionCount ?? 0} bài nộp</span>
                          </div>
                        </div>
                      </div>

                      {/* Management & Sharing Action Bar */}
                      <div className="pt-3 border-t border-gray-100 space-y-2">
                        {/* Upper row: Edit & Submissions */}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/teacher/edit/${exam.id}`}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-gray-500" />
                            <span>Sửa đề</span>
                          </Link>

                          <Link
                            href={`/teacher/submissions/${exam.id}`}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                          >
                            <Users className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Bài nộp</span>
                          </Link>
                        </div>

                        {/* Lower row: Copy Share Link & Take Test */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(exam.id, e)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                            title="Sao chép link làm bài gửi người khác"
                          >
                            {copiedId === exam.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Đã chép link!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Copy Link thi</span>
                              </>
                            )}
                          </button>

                          <Link
                            href={`/exam/${exam.id}`}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
                          >
                            <Play className="h-3.5 w-3.5 fill-white" />
                            <span>Vào thi thử</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY EXAM HISTORY (LỊCH SỬ BÀI ĐÃ LÀM CỦA TÔI) */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-xs">
                <History className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-800 mb-1">Bạn chưa hoàn thành bài thi nào</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                  Khi bạn tham gia làm bài thi từ link của người khác hoặc đề thi của mình, kết quả điểm số cá nhân sẽ được lưu trữ an toàn tại đây.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('my_exams')}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Xem danh sách đề thi của bạn</span>
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Bài kiểm tra đã nộp ({submissions.length})</span>
                  <span>Điểm số / Đánh giá</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {submissions.map((sub) => {
                    const score = sub.score ?? 0;
                    const isHigh = score >= 8.0;
                    const isPass = score >= 5.0;

                    return (
                      <div
                        key={sub.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                              Mã đề: {sub.examId}
                            </span>
                            <span className="text-xs text-gray-400">
                              Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {sub.timeSpentSeconds ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                {Math.floor(sub.timeSpentSeconds / 60)} phút {sub.timeSpentSeconds % 60} giây
                              </span>
                            ) : null}
                            <span className="flex items-center gap-1">
                              <Shield className="h-3.5 w-3.5 text-gray-400" />
                              Vi phạm: {sub.proctoringViolations ?? 0} lần
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-center">
                          <div className="text-right">
                            <div className="text-xl font-black text-emerald-600">
                              {score.toFixed(2)}{' '}
                              <span className="text-xs font-normal text-gray-400">/ 10</span>
                            </div>
                            <span
                              className={`inline-block text-[10px] font-bold uppercase tracking-wider ${
                                isHigh
                                  ? 'text-emerald-600'
                                  : isPass
                                  ? 'text-blue-600'
                                  : 'text-amber-600'
                              }`}
                            >
                              {isHigh ? 'Xuất sắc' : isPass ? 'Đạt' : 'Cần ôn lại'}
                            </span>
                          </div>

                          <Link
                            href={`/exam/${sub.examId}`}
                            className="flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                          >
                            <span>Làm lại</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
