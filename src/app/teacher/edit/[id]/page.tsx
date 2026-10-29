'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../context/AuthContext';
import { Exam, Question, ExamSettings, DEFAULT_EXAM_SETTINGS } from '../../../../types/exam';
import { distributeExamScores, normalizeExamQuestions, normalizeQuestion } from '../../../../parser/examParser';
import { ImportQuestionsModal } from '../../../../components/ImportQuestionsModal';
import { getExam, saveExam } from '../../../../storage/examStorage';
import { QuestionEditorCard } from '../../../../components/QuestionEditorCard';
import { ExamSettingsModal } from '../../../../components/ExamSettingsModal';
import { GdptMatrixModal } from '../../../../components/GdptMatrixModal';
import { Navbar } from '../../../../components/Navbar';
import {
  Printer,
  Save,
  UploadCloud,
  Wand2,
  FileCheck,
  ArrowLeft,
  Settings,
  Plus,
  Clock,
  HelpCircle,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Shield,
  Shuffle,
  BookOpen,
  Scale,
  Calculator,
  Sparkles,
  ShieldAlert,
  Globe,
  Lock,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export default function EditExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = (params?.id as string) || '';
  const { user, loading: authLoading } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<ExamSettings>(DEFAULT_EXAM_SETTINGS);
  const [isPublic, setIsPublic] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [normalizeToast, setNormalizeToast] = useState<string | null>(null);

  // Load exam
  useEffect(() => {
    if (!examId) return;

    const loadData = async () => {
      setIsLoading(true);
      setIsUnauthorized(false);
      setErrorMessage(null);

      // 1. Check local cache
      const local = getExam(examId);
      if (local) {
        setExam(local);
        setTitle(local.title);
        setDurationMinutes(local.durationMinutes);
        setQuestions(local.questions || []);
        setSettings(local.settings || DEFAULT_EXAM_SETTINGS);
        setIsPublic(local.isPublic !== false);
      }

      // 2. Fetch from database
      try {
        const res = await fetch(`/api/exams/${examId}`);
        if (res.status === 403) {
          setIsUnauthorized(true);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        if (data.success && data.exam) {
          // Check ownership if user is loaded
          if (user && user.role !== 'ADMIN' && data.exam.authorId && data.exam.authorId !== user.id) {
            setIsUnauthorized(true);
            setIsLoading(false);
            return;
          }

          setExam(data.exam);
          setTitle(data.exam.title);
          setDurationMinutes(data.exam.durationMinutes);
          setQuestions(data.exam.questions || []);
          setSettings(data.exam.settings || DEFAULT_EXAM_SETTINGS);
          setIsPublic(data.exam.isPublic !== false);
          saveExam(data.exam);
        } else if (!local) {
          setErrorMessage('Không tìm thấy đề thi này');
        }
      } catch (e) {
        console.warn('API error loading exam', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [examId, user]);

  // Question editing handlers
  const handleQuestionChange = (index: number, updated: Question) => {
    const next = [...questions];
    next[index] = updated;
    setQuestions(next);
  };

  const handleDeleteQuestion = (index: number) => {
    const next = questions.filter((_, idx) => idx !== index);
    setQuestions(next);
  };

  const handleAddQuestion = () => {
    const newId = (questions[questions.length - 1]?.id ?? 0) + 1;
    const newQ: Question = {
      id: newId,
      type: 'multiple_choice',
      rawText: `Câu ${newId}: `,
      content: '',
      score: 0.25,
      options: [
        { key: 'A', content: '' },
        { key: 'B', content: '' },
        { key: 'C', content: '' },
        { key: 'D', content: '' },
      ],
      correctAnswer: 'A',
    };
    setQuestions([...questions, newQ]);
  };

  // Batch normalize all questions to standard A-B-C-D format
  const handleNormalizeAllQuestions = () => {
    if (questions.length === 0) return;
    const normalized = normalizeExamQuestions(questions);
    setQuestions(normalized);
    setNormalizeToast(`?? t? ??ng chu?n h?a ${normalized.length} c?u h?i th?nh c?ng!`);
    setTimeout(() => setNormalizeToast(null), 3000);
  };

  // Handle questions imported from Word/PDF/Text
  const handleApplyImportedQuestions = (imported: Question[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      const indexed = imported.map((q, idx) => ({ ...q, id: idx + 1 }));
      setQuestions(indexed);
    } else {
      const startId = questions.length;
      const indexed = imported.map((q, idx) => ({ ...q, id: startId + idx + 1 }));
      setQuestions([...questions, ...indexed]);
    }
    setNormalizeToast(`?? n?p ${imported.length} c?u h?i m?i v?o ?? thi!`);
    setTimeout(() => setNormalizeToast(null), 3000);
  };

  // Identify questions with parsing issues or malformed options
  const malformedCount = React.useMemo(() => {
    return questions.filter((q) => {
      if (q.type === 'multiple_choice' || (!q.type && (q.options?.length ?? 0) > 0)) {
        const opts = q.options || [];
        if (opts.length > 4) return true;
        if (opts.some((o) => !o.content || !o.content.trim())) return true;
        if (opts.some((o) => /^(\s*\*?[A-D][.:)\-]\s*)+/i.test(o.content))) return true;
        const keys = opts.map((o) => o.key);
        if (new Set(keys).size !== keys.length) return true;
        const expected = ['A', 'B', 'C', 'D'].slice(0, opts.length);
        if (keys.some((k, i) => k !== expected[i])) return true;
      }
      return false;
    }).length;
  }, [questions]);

  // Automatically distribute total score evenly (e.g. 10.00) without round-off drift
  const handleAutoDistributeScore = (targetScore: number = 10) => {
    if (questions.length === 0) return;
    const newScores = distributeExamScores(questions.length, targetScore);
    setQuestions(
      questions.map((q, idx) => ({
        ...q,
        score: newScores[idx] ?? 0.25,
      }))
    );
  };

  // Copy shareable exam link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/exam/${examId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Save changes
  const handleSaveExam = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề đề thi');
      return;
    }
    if (questions.length === 0) {
      alert('Đề thi phải có ít nhất 1 câu hỏi');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    const updatedExam: Exam = {
      id: examId,
      title: title.trim(),
      durationMinutes: Number(durationMinutes) || 45,
      totalQuestions: questions.length,
      createdAt: exam?.createdAt || new Date().toISOString(),
      questions,
      settings,
      authorId: exam?.authorId || user?.id,
      isPublic,
    };

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExam),
      });

      if (res.status === 403) {
        setIsUnauthorized(true);
        alert('Bạn không có quyền chỉnh sửa đề thi này');
        return;
      }

      const data = await res.json();
      if (data.success) {
        saveExam(updatedExam);
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          if (user?.role === 'ADMIN') { router.push('/admin'); } else { router.push('/teacher/exams'); }
        }, 1200);
      } else {
        alert(data.error || 'Lỗi khi lưu đề thi');
      }
    } catch (e) {
      console.error('Error saving exam', e);
      saveExam(updatedExam);
      setSaveSuccess(true);
      setTimeout(() => {
        if (user?.role === 'ADMIN') { router.push('/admin'); } else { router.push('/teacher/exams'); }
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  const totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Đang tải thông tin đề thi...</span>
        </div>
      </div>
    );
  }

  // Access Denied Shield for non-authors
  if (isUnauthorized || (exam && user && user.role !== 'ADMIN' && exam.authorId && exam.authorId !== user.id)) {
    return (
      <div className="min-h-screen bg-slate-100 pb-16">
        <Navbar />
        <div className="mx-auto max-w-md my-16 text-center bg-white p-8 rounded-2xl border border-rose-200 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Không có quyền chỉnh sửa</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Đề thi này được tạo bởi một tài khoản khác. Bạn chỉ có quyền vào làm bài thi hoặc xem kết quả của chính mình.
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

  if (errorMessage || !exam) {
    return (
      <div className="min-h-screen bg-slate-100 pb-16">
        <Navbar />
        <div className="mx-auto max-w-md my-16 text-center bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-gray-900 mb-2">Không tìm thấy đề thi</h2>
          <p className="text-xs text-gray-500 mb-6">Đề thi này không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
          <Link
            href="/teacher/exams"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách đề thi</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6">
        {/* Top Header Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={user?.role === 'ADMIN' ? '/admin' : '/teacher/exams'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition shadow-sm"
              title={user?.role === 'ADMIN' ? 'Quay lại Admin Panel' : 'Quay lại danh sách'}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                  <span>Chỉnh sửa đề thi</span>
                  {user?.role === 'ADMIN' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      Admin Editor
                    </span>
                  )}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isPublic
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {isPublic ? 'Công khai' : 'Riêng tư'}
                </span>
              </div>
              <p className="text-xs text-gray-500">Mã đề: {exam.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share link button */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
              title="Sao chép link làm bài gửi học sinh"
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-gray-500" />
                  <span>Copy Link thi</span>
                </>
              )}
            </button>

            {/* Re-import from Word/PDF Modal Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition shadow-2xs"
              title="Nạp lại hoặc bổ sung câu hỏi từ file Word, PDF hoặc TXT"
            >
              <UploadCloud className="h-4 w-4 text-indigo-600" />
              <span className="hidden sm:inline">Nạp từ File</span>
            </button>

            {/* Batch Normalize Questions Button */}
            <button
              onClick={handleNormalizeAllQuestions}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
              title="Chu?n h?a to?n b? c?u h?i v? c?c ph??ng ?n v? ??ng chu?n A-B-C-D"
            >
              <Wand2 className="h-4 w-4 text-amber-600" />
              <span className="hidden sm:inline">Chuẩn hóa A-B-C-D</span>
            </button>

            {/* Matrix GDPT 2018 Button */}
            <button
              onClick={() => setIsMatrixOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-sm"
              title="Bảng ma trận & đặc tả đề thi GDPT 2018"
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="hidden sm:inline">Ma trận GDPT</span>
            </button>

            {/* Print & Word Export Button */}
            <Link
              href={`/exam/${examId}/print`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
              title="In đề thi giấy hoặc Xuất file Word (.doc)"
            >
              <Printer className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">In / Xuất Word</span>
            </Link>
            {/* Settings Modal Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="hidden sm:inline">Cấu hình</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveExam}
              disabled={isSaving}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
                saveSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } disabled:opacity-50`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Đã lưu!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Lưu đề thi</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Basic Info & Sharing Card */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tiêu đề đề thi
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Kiểm tra 1 tiết Đại số 12..."
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Thời gian làm bài (phút)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-xl border border-gray-200 pl-3.5 pr-10 py-2 text-sm font-semibold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Chế độ chia sẻ đề thi
              </label>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  isPublic
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isPublic ? <Globe className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4 text-amber-600" />}
                  <span>{isPublic ? 'Công khai (Public)' : 'Riêng tư (Private)'}</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                  {isPublic ? 'Ai có link cũng thi được' : 'Chỉ mình tôi'}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-500" />
                <strong className="text-gray-900">{questions.length}</strong> câu hỏi
              </span>
              <span className="flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-emerald-500" />
                Tổng điểm: <strong className="text-gray-900">{totalScore.toFixed(2)}</strong> đ
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-amber-500" />
                Giám sát: {settings.enableProctoring ? 'Bật (Chính thức)' : 'Tắt (Tự luyện)'}
              </span>
            </div>

            {/* Auto Distribute Score Button */}
            <button
              onClick={() => handleAutoDistributeScore(10)}
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold transition"
              title="Chia đều điểm các câu hỏi về đúng thang điểm 10.00"
            >
              <Scale className="h-3.5 w-3.5" />
              <span>Chia đều thang điểm 10</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {normalizeToast && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-md animate-in fade-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>{normalizeToast}</span>
            </div>
            <button onClick={() => setNormalizeToast(null)} className="opacity-80 hover:opacity-100">
              ?
            </button>
          </div>
        )}

        {/* Warning Banner for Malformed Questions */}
        {malformedCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-200 text-amber-800 font-bold shrink-0">
                ??
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">
                  Phát hiện {malformedCount} câu hỏi có phương án bị lỗi (trùng ký tự B, phương án rỗng hoặc thừa chữ B.)
                </p>
                <p className="text-[11px] text-amber-700">
                  H? th?ng c? th? t? ??ng b?c t?ch s?ch s?, lo?i b? ph??ng ?n r?ng v? chu?n h?a v? th? t? A, B, C, D ch? v?i 1 click.
                </p>
              </div>
            </div>
            <button
              onClick={handleNormalizeAllQuestions}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition"
            >
              <Wand2 className="h-4 w-4" />
              <span>T? ??ng s?a l?i ({malformedCount} c?u)</span>
            </button>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Nội dung câu hỏi ({questions.length})
            </h2>
            <button
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm câu hỏi mới</span>
            </button>
          </div>

          {questions.map((q, idx) => (
            <QuestionEditorCard
              key={q.id || idx}
              displayNumber={idx + 1}
              question={q}
              onChange={(updated) => handleQuestionChange(idx, updated)}
              onDelete={() => handleDeleteQuestion(idx)}
            />
          ))}

          {questions.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
              <HelpCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">Chưa có câu hỏi nào trong đề thi</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Bấm nút bên dưới để tạo câu hỏi đầu tiên.
              </p>
              <button
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm câu hỏi mới</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Floating Add Button */}
        {questions.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-3 text-xs font-semibold text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm câu hỏi tiếp theo</span>
            </button>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <ExamSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(updated: ExamSettings) => setSettings(updated)}
      />

      {/* Import Questions Modal */}
      <ImportQuestionsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onApplyQuestions={handleApplyImportedQuestions}
        currentCount={questions.length}
      />

      {/* GDPT 2018 Matrix Modal */}
      <GdptMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        questions={questions}
        onApplyMatrix={(updated) => setQuestions(updated)}
      />
    </div>
  );
}
