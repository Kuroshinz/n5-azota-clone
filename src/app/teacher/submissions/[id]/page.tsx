'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../context/AuthContext';
import { Exam, Submission } from '../../../../types/exam';
import { getExam, saveExam, getSubmissions, saveSubmission } from '../../../../storage/examStorage';
import { QuestionCard } from '../../../../components/QuestionCard';
import { Navbar } from '../../../../components/Navbar';
import {
  ArrowLeft,
  Users,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Eye,
  Loader2,
  Search,
  Phone,
  FileCheck2,
  Calendar,
  ExternalLink,
  Download,
  Award,
  TrendingUp,
  Filter,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export default function TeacherSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = (params?.id as string) || '';
  const { user, loading: authLoading } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'violations' | 'high_score' | 'low_score'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'score_desc' | 'score_asc'>('date_desc');
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    if (!examId) return;

    // 1. Initial render from local cache
    const localExam = getExam(examId);
    if (localExam) setExam(localExam);
    const localSubs = getSubmissions(examId);
    if (localSubs.length > 0) {
      setSubmissions(localSubs);
      setSelectedSub(localSubs[0]);
    }

    // 2. Fetch server database state via API
    setIsLoading(true);
    fetch(`/api/exams/${examId}`)
      .then(res => {
        if (res.status === 403) {
          setIsUnauthorized(true);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data?.success && data.exam) {
          if (user && data.exam.authorId && data.exam.authorId !== user.id && user.role !== 'ADMIN') {
            setIsUnauthorized(true);
            return;
          }
          setExam(data.exam);
          saveExam(data.exam);
        }
      })
      .catch(() => {});

    fetch(`/api/submissions?examId=${examId}`)
      .then(res => {
        if (res.status === 403) {
          setIsUnauthorized(true);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data?.success && Array.isArray(data.submissions)) {
          setSubmissions(data.submissions);
          data.submissions.forEach((s: Submission) => saveSubmission(s));
          if (data.submissions.length > 0 && !selectedSub) {
            setSelectedSub(data.submissions[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, [examId, user]);

  // Summary Metrics
  const stats = useMemo(() => {
    if (submissions.length === 0) {
      return { total: 0, avgScore: 0, maxScore: 0, minScore: 0, violationCount: 0 };
    }
    const total = submissions.length;
    let sumScore = 0;
    let max = -Infinity;
    let min = Infinity;
    let violations = 0;

    submissions.forEach(s => {
      sumScore += s.score;
      if (s.score > max) max = s.score;
      if (s.score < min) min = s.score;
      const report = s.proctoringReport;
      if ((report?.outScreenCount || 0) > 0 || (report?.fullscreenExitCount || 0) > 0) {
        violations++;
      }
    });

    return {
      total,
      avgScore: Number((sumScore / total).toFixed(2)),
      maxScore: Number(max.toFixed(2)),
      minScore: Number(min.toFixed(2)),
      violationCount: violations,
    };
  }, [submissions]);

  // Filtered and sorted submissions
  const filteredSubmissions = useMemo(() => {
    let result = [...submissions];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        s =>
          s.studentName.toLowerCase().includes(q) ||
          (s.studentPhone && s.studentPhone.includes(q)) ||
          (s.user?.phone && s.user.phone.includes(q))
      );
    }

    if (filterType === 'violations') {
      result = result.filter(s => {
        const r = s.proctoringReport;
        return (r?.outScreenCount || 0) > 0 || (r?.fullscreenExitCount || 0) > 0;
      });
    } else if (filterType === 'high_score') {
      result = result.filter(s => (s.score / (s.totalScore || 10)) >= 0.8);
    } else if (filterType === 'low_score') {
      result = result.filter(s => (s.score / (s.totalScore || 10)) < 0.5);
    }

    result.sort((a, b) => {
      if (sortBy === 'score_desc') return b.score - a.score;
      if (sortBy === 'score_asc') return a.score - b.score;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    return result;
  }, [submissions, searchTerm, filterType, sortBy]);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (submissions.length === 0) {
      alert('Chưa có bài nộp nào để xuất bảng điểm!');
      return;
    }

    const headers = [
      'STT',
      'Họ và tên thí sinh',
      'Số điện thoại',
      'Điểm số',
      'Thang điểm',
      'Thời gian nộp bài',
      'Số lần rời màn hình',
      'Số lần thoát toàn màn hình',
      'Ghi chú vi phạm'
    ];

    const rows = submissions.map((s, index) => {
      const outScreen = s.proctoringReport?.outScreenCount || 0;
      const fsExit = s.proctoringReport?.fullscreenExitCount || 0;
      const hasViolation = outScreen > 0 || fsExit > 0;
      const dateStr = new Date(s.submittedAt).toLocaleString('vi-VN');

      return [
        index + 1,
        `"${s.studentName.replace(/"/g, '""')}"`,
        `"${s.studentPhone || s.user?.phone || ''}"`,
        s.score,
        s.totalScore || 10,
        `"${dateStr}"`,
        outScreen,
        fsExit,
        hasViolation ? '"Có nghi vấn vi phạm quy chế"' : '"Hợp lệ"'
      ].join(',');
    });

    // UTF-8 BOM (\uFEFF) ensures Vietnamese accented characters render perfectly in Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (exam?.title || 'bang_diem').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `${safeTitle}_bang_diem.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Đang xác thực quyền truy cập...</span>
        </div>
      </div>
    );
  }

  // Access Denied Shield for non-authors
  if (isUnauthorized || (exam && user && exam.authorId && exam.authorId !== user.id && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-slate-50 pb-16">
        <Navbar examTitle={exam?.title} />
        <div className="mx-auto max-w-md my-16 text-center bg-white p-8 rounded-2xl border border-rose-200 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Không có quyền xem bảng điểm bài nộp</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Chỉ người tạo ra đề thi này hoặc Quản trị viên mới có quyền xem danh sách và bảng điểm của các học sinh nộp bài.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Về trang chủ</span>
            </Link>
            <Link
              href={`/exam/${examId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-sm"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Vào làm bài thi này</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Universal Navigation */}
      <Navbar examTitle={exam?.title} />

      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 sm:px-6 py-4 shadow-xs sticky top-14 z-20 backdrop-blur-md bg-white/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/teacher/exams')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              title="Quay lại danh sách đề thi"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                Bảng điểm & Giám sát thi: {exam?.title || 'Đề thi'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Cập nhật trực tiếp từ cơ sở dữ liệu | Tổng cộng: <strong className="text-indigo-600 font-bold">{submissions.length} bài nộp</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Xuất Excel (CSV)</span>
            </button>

            <Link
              href={`/exam/${examId}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Link phòng thi</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
        {/* KPI Metrics Summary Cards */}
        {submissions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">Lượt nộp bài</span>
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-gray-900">{stats.total}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Thí sinh đã hoàn thành</div>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">Điểm trung bình</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600">{stats.avgScore} <span className="text-xs text-gray-400 font-normal">/ 10</span></div>
              <div className="text-[11px] text-gray-400 mt-0.5">Phổ điểm toàn lớp</div>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">Cao nhất / Thấp nhất</span>
                <Award className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-gray-900">
                <span className="text-indigo-600">{stats.maxScore}</span> / <span className="text-gray-400">{stats.minScore}</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Phân hóa kết quả</div>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">Nghi vấn gian lận</span>
                <ShieldAlert className="h-4 w-4 text-rose-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-600">{stats.violationCount}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Rời tab hoặc thoát toàn màn hình</div>
            </div>
          </div>
        )}

        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-xs">
            <Users className="mb-3 h-14 w-14 text-gray-300" />
            <h2 className="text-base font-bold text-gray-900 mb-1">Chưa có bài nộp nào</h2>
            <p className="text-xs text-gray-500 max-w-sm mb-4">
              Chưa có học sinh nào nộp bài cho đề thi này. Hãy chia sẻ link hoặc mã phòng thi để học sinh bắt đầu làm bài.
            </p>
            <Link
              href={`/exam/${examId}`}
              target="_blank"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              Mở link phòng thi
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Submissions Table / List */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
              {/* Filter & Search Bar */}
              <div className="p-4 border-b border-gray-100 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Tìm tên học sinh, số điện thoại..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                      filterType === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tất cả ({submissions.length})
                  </button>
                  <button
                    onClick={() => setFilterType('violations')}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                      filterType === 'violations' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Có vi phạm ({stats.violationCount})
                  </button>
                  <button
                    onClick={() => setFilterType('high_score')}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                      filterType === 'high_score' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Điểm giỏi (≥ 8)
                  </button>
                </div>
              </div>

              {/* Submissions List */}
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {filteredSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    Không tìm thấy bài nộp phù hợp
                  </div>
                ) : (
                  filteredSubmissions.map(sub => {
                    const isSelected = selectedSub?.id === sub.id;
                    const report = sub.proctoringReport;
                    const violationCount = (report?.outScreenCount || 0) + (report?.fullscreenExitCount || 0);
                    const isViolation = violationCount > 0;
                    const dateFormatted = new Date(sub.submittedAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    });

                    return (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedSub(sub)}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                            : 'hover:bg-gray-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs uppercase ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {sub.studentName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-gray-900 truncate">
                                {sub.studentName}
                              </span>
                              {isViolation && (
                                <span className="inline-flex items-center gap-0.5 rounded-sm bg-rose-100 px-1 py-0.2 text-[9px] font-bold text-rose-700" title={`Vi phạm giám sát: ${violationCount} lần`}>
                                  <ShieldAlert className="h-2.5 w-2.5" />
                                  {violationCount}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                              {sub.studentPhone && <span>{sub.studentPhone}</span>}
                              <span>•</span>
                              <span>{dateFormatted}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-sm font-black ${
                            sub.score >= 8 ? 'text-emerald-600' : sub.score >= 5 ? 'text-indigo-600' : 'text-rose-600'
                          }`}>
                            {sub.score}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">/{sub.totalScore || 10}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Selected Submission Detail */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5">
              {selectedSub ? (
                <div className="space-y-6">
                  {/* Candidate Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-gray-900">{selectedSub.studentName}</h2>
                        <span className="text-xs text-gray-400 font-mono">ID: {selectedSub.id}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        {selectedSub.studentPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            {selectedSub.studentPhone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {new Date(selectedSub.submittedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-black text-indigo-600">
                          {selectedSub.score} <span className="text-xs text-gray-400 font-normal">/ {selectedSub.totalScore || 10}</span>
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Điểm tổng kết</div>
                      </div>

                      <Link
                        href={`/exam/${examId}/result/${selectedSub.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Xem trang kết quả</span>
                      </Link>
                    </div>
                  </div>

                  {/* Proctoring Log Inspection */}
                  <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-indigo-600" />
                        Nhật ký giám sát thi trực tuyến
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">
                          Thoát màn hình: <strong className="text-rose-600">{selectedSub.proctoringReport?.outScreenCount || 0}</strong>
                        </span>
                        <span>•</span>
                        <span className="text-gray-500">
                          Thoát toàn màn hình: <strong className="text-amber-600">{selectedSub.proctoringReport?.fullscreenExitCount || 0}</strong>
                        </span>
                      </div>
                    </div>

                    {selectedSub.proctoringReport?.events && selectedSub.proctoringReport.events.length > 0 ? (
                      <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
                        {selectedSub.proctoringReport.events.map((evt, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] bg-white rounded-lg p-2 border border-gray-200/60">
                            <span className="text-gray-700 font-medium">{evt.details || 'Cảnh báo vi phạm quy chế'}</span>
                            <span className="text-gray-400 font-mono">{new Date(evt.timestamp).toLocaleTimeString('vi-VN')}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Thí sinh làm bài nghiêm túc, không ghi nhận hành vi chuyển tab hay thoát màn hình.
                      </p>
                    )}
                  </div>

                  {/* Question-by-Question Answers */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                      Chi tiết đáp án thí sinh đã chọn ({exam?.questions?.length || 0} câu)
                    </h3>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {exam?.questions?.map((q, idx) => {
                        const studentAns = selectedSub.answers?.[q.id];
                        const hasAns = studentAns !== undefined && studentAns !== null && studentAns !== '';

                        return (
                          <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-3.5 text-xs">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-gray-800">
                                Câu {idx + 1}: <span className="font-normal text-gray-500">({q.score} điểm)</span>
                              </span>
                              <span className="text-[11px] font-semibold text-gray-400">
                                {q.type === 'multiple_choice' ? 'Trắc nghiệm' : q.type === 'true_false' ? 'Đúng / Sai' : 'Trả lời ngắn'}
                              </span>
                            </div>

                            <div className="text-gray-700 mb-2 line-clamp-2">{q.content}</div>

                            <div className="rounded-lg bg-gray-50 p-2 text-xs flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="text-gray-500">Thí sinh chọn: </span>
                                <strong className="text-indigo-700 font-bold">
                                  {hasAns ? (typeof studentAns === 'object' ? JSON.stringify(studentAns) : String(studentAns)) : 'Chưa trả lời'}
                                </strong>
                              </div>
                              {q.correctAnswer && (
                                <div>
                                  <span className="text-gray-500">Đáp án đúng: </span>
                                  <strong className="text-emerald-700 font-bold">{q.correctAnswer}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-gray-400 text-xs">
                  Chọn một bài nộp ở danh sách bên trái để xem chi tiết
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
