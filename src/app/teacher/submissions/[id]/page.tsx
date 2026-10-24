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
          if (user && data.exam.authorId && data.exam.authorId !== user.id) {
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
    result.sort((a, b) => {
      if (sortBy === 'score_desc') return b.score - a.score;
      if (sortBy === 'score_asc') return a.score - b.score;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
    return result;
  }, [submissions, searchTerm, sortBy]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Đang xác thực quyền truy cập...</span>
        </div>
      </div>
    );
  }

  // Access Denied Shield for non-authors
  if (isUnauthorized || (exam && user && exam.authorId && exam.authorId !== user.id)) {
    return (
      <div className="min-h-screen bg-slate-100 pb-16">
        <Navbar examTitle={exam?.title} />
        <div className="mx-auto max-w-md my-16 text-center bg-white p-8 rounded-2xl border border-rose-200 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Không có quyền xem kết quả bài nộp</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Chỉ người tạo ra đề thi này mới có quyền xem danh sách và bảng điểm của các học sinh nộp bài.
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
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Universal Navigation */}
      <Navbar examTitle={exam?.title} />

      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 sm:px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/teacher/exams')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                Báo cáo kết quả & Giám sát thi: {exam?.title || 'Đề thi'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Tổng cộng: <strong className="text-indigo-600">{submissions.length} thí sinh nộp bài</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang tải...</span>
              </div>
            )}
            <Link
              href={`/exam/${examId}`}
              target="_blank"
              className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
            >
              Link làm bài thi
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Users className="mb-3 h-12 w-12 text-gray-300" />
            <h2 className="text-base font-bold text-gray-800 mb-1">Chưa có bài nộp nào</h2>
            <p className="text-xs text-gray-500 max-w-sm mb-4">
              Chưa có học sinh nào nộp bài cho đề thi này. Hãy chia sẻ link phòng thi để thí sinh đăng nhập và bắt đầu làm bài.
            </p>
            <Link
              href={`/exam/${examId}`}
              target="_blank"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Vào thi thử nghiệm ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Submissions List */}
            <div className="space-y-3 lg:col-span-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Thí sinh đã nộp ({filteredSubmissions.length})
                </h2>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 outline-none"
                >
                  <option value="date_desc">Mới nộp nhất</option>
                  <option value="score_desc">Điểm cao nhất</option>
                  <option value="score_asc">Điểm thấp nhất</option>
                </select>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm theo tên học sinh, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              </div>

              {/* Submissions List scroll */}
              <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                {filteredSubmissions.map((sub) => {
                  const isSelected = selectedSub?.id === sub.id;
                  const violations = sub.proctoringViolations ?? 0;
                  const isSuspicious = violations >= 3;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSub(sub)}
                      className={`w-full rounded-xl border p-3.5 text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-gray-900">{sub.studentName}</span>
                            {isSuspicious && (
                              <span
                                className="flex items-center gap-0.5 rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-700"
                                title={`Đã có ${violations} lần vi phạm thoát màn hình`}
                              >
                                <AlertTriangle className="h-3 w-3" />
                                {violations}
                              </span>
                            )}
                          </div>
                          {(sub.studentPhone || sub.user?.phone) && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                              <Phone className="h-2.5 w-2.5" />
                              {sub.studentPhone || sub.user?.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                            <Calendar className="h-2.5 w-2.5" />
                            {new Date(sub.submittedAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="inline-block rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-700">
                            {sub.score.toFixed(2)} đ
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detailed Submissions Inspector */}
            <div className="lg:col-span-2">
              {selectedSub ? (
                <div className="space-y-4">
                  {/* Student Summary Card */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-indigo-600" />
                          <h2 className="text-base font-bold text-gray-900">{selectedSub.studentName}</h2>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Thời gian nộp:{' '}
                          {new Date(selectedSub.submittedAt).toLocaleString('vi-VN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            Tổng điểm đạt
                          </div>
                          <div className="text-2xl font-black text-emerald-600">
                            {selectedSub.score.toFixed(2)}{' '}
                            <span className="text-xs font-normal text-gray-400">/ 10</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Proctoring telemetry breakdown */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-center">
                        <div className="text-[10px] text-gray-500 font-medium">Vi phạm giám sát</div>
                        <div className={`text-sm font-bold mt-0.5 ${
                          (selectedSub.proctoringViolations ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {selectedSub.proctoringViolations ?? 0} lần
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-center">
                        <div className="text-[10px] text-gray-500 font-medium">Thời gian làm bài</div>
                        <div className="text-sm font-bold text-gray-800 mt-0.5">
                          {selectedSub.timeSpentSeconds
                            ? `${Math.floor(selectedSub.timeSpentSeconds / 60)}p ${selectedSub.timeSpentSeconds % 60}s`
                            : '--'}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-center">
                        <div className="text-[10px] text-gray-500 font-medium">Thiết bị / Trình duyệt</div>
                        <div className="text-[11px] font-semibold text-gray-700 mt-0.5 truncate" title={selectedSub.deviceInfo}>
                          {selectedSub.deviceInfo || 'Web Browser'}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-center">
                        <div className="text-[10px] text-gray-500 font-medium">Trạng thái nộp</div>
                        <div className="text-sm font-bold text-emerald-600 mt-0.5">
                          {selectedSub.isAutoSubmitted ? 'Thu tự động' : 'Tự nộp'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question-by-Question Review */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Chi tiết bài làm từng câu
                    </h3>

                    {exam?.questions?.map((q, idx) => {
                      const studentAns = selectedSub.answers?.[q.id];
                      return (
                        <QuestionCard
                          key={q.id || idx}
                          displayNumber={idx + 1}
                          question={q}
                          selectedOption={studentAns}
                          showAnswer={true}
                          readOnly={true}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                  <div className="text-gray-400 text-xs">Chọn một thí sinh từ danh sách bên trái để xem bài làm chi tiết</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
