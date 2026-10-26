'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Exam, Submission } from '../../../types/exam';
import { getStoredExams, getSubmissions, saveExam } from '../../../storage/examStorage';
import { ShareExamModal } from '../../../components/ShareExamModal';
import { ExamSettingsModal } from '../../../components/ExamSettingsModal';
import { Navbar } from '../../../components/Navbar';
import {
  BookOpen,
  Plus,
  Clock,
  HelpCircle,
  Copy,
  ExternalLink,
  Users,
  QrCode,
  Calendar,
  Check,
  ShieldCheck,
  Lock,
  Globe,
  Shuffle,
  Loader2,
  Edit3,
  Trash2,
  AlertTriangle,
  Search,
  Settings,
  FileSpreadsheet,
} from 'lucide-react';

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedShareExam, setSelectedShareExam] = useState<Exam | null>(null);
  const [selectedSettingsExam, setSelectedSettingsExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'proctoring' | 'practice' | 'public' | 'private'>('all');

  // Sync with Server Database
  const loadExams = async () => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
      if (data.success && Array.isArray(data.exams)) {
        setExams(data.exams);
        data.exams.forEach((ex: Exam) => saveExam(ex));
      } else {
        setExams([]);
      }
    } catch (err) {
      console.warn('Could not fetch exams from API, using cached data', err);
      const localExams = getStoredExams();
      setExams(localExams);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleCopyLink = (examId: string) => {
    const url = `${window.location.origin}/exam/${examId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(examId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    const id = examToDelete.id;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setExams(prev => prev.filter(e => e.id !== id));
        setExamToDelete(null);
      } else {
        alert(data.error || 'Không thể xóa đề thi');
      }
    } catch (e) {
      console.error('Delete exam error', e);
      alert('Đã xảy ra lỗi khi xóa đề thi');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveSettings = async (updatedSettings: any) => {
    if (!selectedSettingsExam) return;
    try {
      const res = await fetch(`/api/exams/${selectedSettingsExam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings }),
      });
      const data = await res.json();
      if (data.success && data.exam) {
        setExams(prev => prev.map(e => e.id === data.exam.id ? { ...e, settings: data.exam.settings } : e));
      }
    } catch (e) {
      console.error('Failed to update exam settings', e);
    } finally {
      setSelectedSettingsExam(null);
    }
  };

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const matchSearch =
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'proctoring') return exam.settings?.enableProctoring;
      if (statusFilter === 'practice') return !exam.settings?.enableProctoring;
      if (statusFilter === 'public') return exam.isPublic !== false;
      if (statusFilter === 'private') return exam.isPublic === false;

      return true;
    });
  }, [exams, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Quản lý đề thi của tôi
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Đồng bộ trực tiếp với Cơ sở dữ liệu | Tạo đề thi mới, cấu hình phòng thi và xem bảng điểm thí sinh nộp bài.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/teacher/create"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo đề thi mới</span>
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề hoặc mã đề..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả ({exams.length})
            </button>
            <button
              onClick={() => setStatusFilter('proctoring')}
              className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                statusFilter === 'proctoring' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Giám sát
            </button>
            <button
              onClick={() => setStatusFilter('practice')}
              className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                statusFilter === 'practice' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Ôn tập
            </button>
            <button
              onClick={() => setStatusFilter('public')}
              className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                statusFilter === 'public' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Công khai
            </button>
          </div>
        </div>

        {/* Empty State */}
        {exams.length === 0 && !isLoading && (
          <div className="my-12 rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-xs max-w-lg mx-auto">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Chưa có đề thi nào</h3>
            <p className="text-xs text-gray-500 mb-6">
              Bạn chưa tạo đề thi nào. Hãy bắt đầu bằng cách tải lên file Word (.docx), Markdown (.md), PDF hoặc nhập đề thi trực tiếp!
            </p>
            <Link
              href="/teacher/create"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo đề thi ngay</span>
            </Link>
          </div>
        )}

        {/* Exams Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map(exam => {
            const submissionsCount = exam.submissionCount ?? getSubmissions(exam.id).length;
            const createdDate = new Date(exam.createdAt).toLocaleDateString('vi-VN');
            const isPublic = exam.isPublic !== false;

            return (
              <div
                key={exam.id}
                className="group flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-indigo-300"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                      <BookOpen className="h-3 w-3" />
                      ID: {exam.id}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {createdDate}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition line-clamp-2">
                    {exam.title}
                  </h3>

                  {/* Settings Badges */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {isPublic ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <Globe className="h-3 w-3" />
                        Công khai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                        <Lock className="h-3 w-3" />
                        Riêng tư
                      </span>
                    )}

                    {exam.settings?.enableProctoring ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                        <ShieldCheck className="h-3 w-3" />
                        Giám sát thi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                        <BookOpen className="h-3 w-3" />
                        Ôn tập
                      </span>
                    )}

                    {exam.settings?.password && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                        <Lock className="h-3 w-3" />
                        Mật khẩu PIN
                      </span>
                    )}

                    {(exam.settings?.shuffleQuestions || exam.settings?.shuffleOptions) && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200">
                        <Shuffle className="h-3 w-3" />
                        Đảo đề
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{exam.durationMinutes} phút</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                      <span>{exam.totalQuestions} câu hỏi</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <strong className="text-indigo-700">{submissionsCount} bài nộp</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-4 space-y-2">
                  {/* Primary Action: View Submissions / Gradebook */}
                  <Link
                    href={`/teacher/submissions/${exam.id}`}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-50 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                    <span>Xem bảng điểm bài nộp ({submissionsCount})</span>
                  </Link>

                  {/* Row 2: Copy Link & QR */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(exam.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                    >
                      {copiedId === exam.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Đã chép link</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-gray-500" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedShareExam(exam)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                      title="Mã QR & Chia sẻ nâng cao"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSettingsExam(exam)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                      title="Cấu hình đề thi"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Row 3: Edit & Delete Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/teacher/edit/${exam.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-gray-500" />
                      <span>Sửa nội dung</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setExamToDelete(exam)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                      title="Xóa đề thi"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Share Modal */}
      {selectedShareExam && (
        <ShareExamModal
          isOpen={true}
          onClose={() => setSelectedShareExam(null)}
          examId={selectedShareExam.id}
          examTitle={selectedShareExam.title}
          durationMinutes={selectedShareExam.durationMinutes}
          totalQuestions={selectedShareExam.totalQuestions}
        />
      )}

      {/* Exam Settings Modal */}
      {selectedSettingsExam && (
        <ExamSettingsModal
          isOpen={true}
          onClose={() => setSelectedSettingsExam(null)}
          settings={selectedSettingsExam.settings || {
            shuffleQuestions: false,
            shuffleOptions: false,
            enableProctoring: false,
            maxViolations: 3,
            showResultAfterSubmit: 'score_and_answers',
          }}
          onSaveSettings={handleSaveSettings}
        />
      )}

      {/* Delete Confirmation Modal */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-2">
              Xác nhận xóa đề thi?
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa đề thi{' '}
              <strong className="text-gray-900 font-semibold">&quot;{examToDelete.title}&quot;</strong>?
              Hành động này sẽ xóa vĩnh viễn đề thi và toàn bộ dữ liệu bài nộp liên quan khỏi hệ thống.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setExamToDelete(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteExam}
                disabled={deletingId !== null}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-50"
              >
                {deletingId ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xóa vĩnh viễn</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
