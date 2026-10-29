'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { Exam, Question, StudentAnswerValue, Submission, DEFAULT_EXAM_SETTINGS } from '../../../types/exam';
import {
  getExam,
  saveExam,
  getDraft,
  saveDraft,
  clearDraft,
  calculateScore,
  saveSubmission,
} from '../../../storage/examStorage';
import { shuffleExamQuestions, validateExamAccess } from '../../../utils/examSettings';
import { useProctoring } from '../../../hooks/useProctoring';
import { QuestionCard } from '../../../components/QuestionCard';
import { QuestionNavGrid } from '../../../components/QuestionNavGrid';
import { ProctoringModal } from '../../../components/ProctoringModal';
import {
  Printer,
  Timer,
  Award,
  Clock,
  Shield,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  BookOpen,
  Lock,
  Calendar,
  Home,
  LogIn,
  LayoutGrid,
  X,
  List,
  Layers,
  ChevronLeft,
  ChevronRight,
  Flag,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const DEFAULT_SAMPLE_EXAM: Exam = {
  id: 'sample-exam-1',
  title: 'Đề thi minh họa chuẩn GDPT 2018 (3 Dạng câu hỏi)',
  durationMinutes: 20,
  totalQuestions: 4,
  createdAt: new Date().toISOString(),
  settings: DEFAULT_EXAM_SETTINGS,
  questions: [
    {
      id: 1,
      type: 'multiple_choice',
      rawText: 'Câu 1...',
      content: 'Tìm tập nghiệm của phương trình bậc hai $x^2 - 5x + 6 = 0$.',
      options: [
        { key: 'A', content: '$S = \\{1; 6\\}$' },
        { key: 'B', content: '$S = \\{2; 3\\}$' },
        { key: 'C', content: '$S = \\{-2; -3\\}$' },
        { key: 'D', content: '$S = \\{-1; -6\\}$' },
      ],
      correctAnswer: 'B',
      explanation: 'Ta có $x^2 - 5x + 6 = (x - 2)(x - 3) = 0 \\Leftrightarrow x = 2$ hoặc $x = 3$.',
      score: 2.5,
    },
    {
      id: 2,
      type: 'multiple_choice',
      rawText: 'Câu 2...',
      content: 'Tính tích phân sau: $$\\int_0^1 (2x + 1) dx$$',
      options: [
        { key: 'A', content: '$1$' },
        { key: 'B', content: '$2$' },
        { key: 'C', content: '$3$' },
        { key: 'D', content: '$0$' },
      ],
      correctAnswer: 'B',
      explanation: 'Ta có $\\int_0^1 (2x + 1) dx = [x^2 + x]_0^1 = (1 + 1) - 0 = 2$.',
      score: 2.5,
    },
    {
      id: 3,
      type: 'true_false',
      rawText: 'Câu 3...',
      content: 'Cho hàm số $y = f(x) = x^3 - 3x^2 + 2$. Các khẳng định sau đúng hay sai?',
      options: [],
      subItems: [
        { key: 'a', content: 'Đồ thị hàm số đi qua điểm $A(0; 2)$', correctAnswer: true },
        { key: 'b', content: 'Đạo hàm là $f\'(x) = 3x^2 - 6x$', correctAnswer: true },
        { key: 'c', content: 'Hàm số đạt cực đại tại $x = 2$', correctAnswer: false },
        { key: 'd', content: 'Giá trị cực tiểu của hàm số bằng $-2$', correctAnswer: true },
      ],
      score: 2.5,
      explanation: 'Hàm số đạt cực đại tại x = 0 (f(0) = 2) và cực tiểu tại x = 2 (f(2) = -2).',
    },
    {
      id: 4,
      type: 'short_answer',
      rawText: 'Câu 4...',
      content: 'Tìm số điểm cực trị của đồ thị hàm số $g(x) = x^4 - 2x^2 + 3$.',
      options: [],
      acceptedAnswers: ['3'],
      score: 2.5,
      explanation: 'Ta có $g\'(x) = 4x(x^2 - 1) = 0 \\Leftrightarrow x = 0, x = \\pm 1$ (3 điểm cực trị).',
    },
  ],
};

export default function ExamTakingPage() {
  const params = useParams();
  const router = useRouter();
  const examId = (params?.id as string) || 'sample-exam-1';
  const searchParams = useSearchParams();
  const isRetryParam = searchParams?.get('retry') === 'true';
  const [isRetryMode, setIsRetryMode] = useState(false);
  const isPreview = searchParams?.get('preview') === 'true';
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);



  const [exam, setExam] = useState<Exam>(DEFAULT_SAMPLE_EXAM);
  const [displayQuestions, setDisplayQuestions] = useState<Question[]>(DEFAULT_SAMPLE_EXAM.questions);
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [accessError, setAccessError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user?.fullName) {
      setStudentName(user.fullName);
    }
    if (user?.phone) {
      setStudentPhone(user.phone);
    }
  }, [user]);

  const [hasStarted, setHasStarted] = useState(false);

  // Keyboard navigation for single mode
  useEffect(() => {
    if (!hasStarted || viewMode !== 'single') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'ArrowLeft') {
        setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentQuestionIndex(prev => Math.min(displayQuestions.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, viewMode, displayQuestions.length]);

  const handleJumpToQuestion = (questionId: number) => {
    const idx = displayQuestions.findIndex(q => q.id === questionId);
    if (idx !== -1) {
      setCurrentQuestionIndex(idx);
    }
    if (viewMode === 'all') {
      setTimeout(() => {
        const el = document.getElementById(`question-${questionId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  const [answers, setAnswers] = useState<Record<number, StudentAnswerValue>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(new Set());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(20 * 60);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const isProctoringEnabled = Boolean(exam.settings?.enableProctoring);
  const maxViolations = exam.settings?.maxViolations ?? 3;

  // Proctoring telemetry sensor
  const { report, latestViolation, requestFullscreen, getReport } = useProctoring({
    enabled: hasStarted && isProctoringEnabled,
    onViolation: () => {
      if (!isProctoringEnabled) return;
      setShowWarningModal(true);

      const currentCount = report.outScreenCount + report.fullscreenExitCount + 1;
      if (maxViolations > 0 && currentCount >= maxViolations) {
        setIsAutoSubmitting(true);
        setTimeout(() => {
          handleSubmitExam(true);
        }, 1500);
      }
    },
  });

  // Load exam and draft
  useEffect(() => {
    // 1. Initial fallback to local cache
    const localExam = getExam(examId);
    if (localExam) {
      setExam(localExam);
      setDisplayQuestions(localExam.questions);
      setTimeLeftSeconds(localExam.durationMinutes * 60);
    } else {
      const fallback = { ...DEFAULT_SAMPLE_EXAM, id: examId };
      setExam(fallback);
      setDisplayQuestions(fallback.questions);
      setTimeLeftSeconds(fallback.durationMinutes * 60);
    }

    // 2. Fetch official exam from server database
    fetch(`/api/exams/${examId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.exam) {
          setExam(data.exam);
          let questionsToDisplay = data.exam.questions || [];
          if (isRetryParam && typeof window !== 'undefined') {
            try {
              const stored = sessionStorage.getItem('n5_retry_wrong_qids_' + examId);
              if (stored) {
                const wrongIds = JSON.parse(stored);
                const filtered = questionsToDisplay.filter((q: any) =>
                  wrongIds.includes(q.id) || wrongIds.includes(Number(q.id)) || wrongIds.includes(String(q.id))
                );
                if (filtered.length > 0) {
                  questionsToDisplay = filtered;
                  setIsRetryMode(true);
                }
              }
            } catch {}
          }
          setDisplayQuestions(questionsToDisplay);
          const customTime = isRetryParam ? Math.max(5, questionsToDisplay.length * 3) : data.exam.durationMinutes;
          setTimeLeftSeconds(customTime * 60);
          saveExam(data.exam);
        }
      })
      .catch(err => {
        console.warn('Could not fetch exam from API, using cached version', err);
      });

    // 3. Load active student draft
    const savedDraft = getDraft(examId);
    if (savedDraft && Object.keys(savedDraft).length > 0) {
      setAnswers(savedDraft);
    }
  }, [examId]);

  // Countdown timer
  useEffect(() => {
    if (!hasStarted) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted]);

  // Answer selection & auto-save
  const handleSelectOption = (questionId: number, val: StudentAnswerValue) => {
    if (isAutoSubmitting) return;
    const nextAnswers = { ...answers, [questionId]: val };
    setAnswers(nextAnswers);
    if (exam) {
      saveDraft(exam.id, nextAnswers);
    }
  };

  const handleToggleFlag = (questionId: number) => {
    setFlaggedIds(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleStartExam = async () => {
    // Validate candidate name if not logged in
    const activeName = user?.fullName || studentName.trim();
    if (!activeName) {
      setAccessError('Vui lòng nhập họ và tên của bạn trước khi bắt đầu làm bài thi!');
      return;
    }

    // Validate access (password / time limits)
    const check = validateExamAccess(exam.settings, passwordInput);
    if (!check.allowed) {
      if (check.reason === 'invalid_password') {
        setAccessError('Mật khẩu đề thi không đúng. Vui lòng kiểm tra lại!');
      } else if (check.reason === 'not_started') {
        setAccessError('Chưa đến thời gian mở đề thi!');
      } else if (check.reason === 'ended') {
        setAccessError('Đề thi đã quá hạn chốt nộp bài!');
      }
      return;
    }

    setAccessError(null);

    // Apply shuffling
    const shuffled = shuffleExamQuestions(
      displayQuestions,
      exam.settings?.shuffleQuestions ?? false,
      exam.settings?.shuffleOptions ?? false
    );
    setDisplayQuestions(shuffled);

    setHasStarted(true);

    if (isProctoringEnabled) {
      await requestFullscreen();
    }
  };

  const handleSubmitExam = async (forced = false) => {
    if (!exam || isSubmitting) return;

    setIsSubmitting(true);
    const finalReport = getReport();

    if (forced) {
      finalReport.events.push({
        type: 'out_screen',
        timestamp: Date.now(),
        details: 'Tự động thu bài do vi phạm quy chế thi vượt quá giới hạn cho phép',
      });
    }

    const scoreResult = calculateScore(exam, answers);
    const finalStudentName = user?.fullName || studentName.trim() || 'Học sinh';
    const finalStudentPhone = user?.phone || studentPhone.trim() || null;

    let finalSubmission: Submission = {
      id: `sub-${Date.now()}`,
      examId: exam.id,
      userId: user?.id || null,
      studentName: finalStudentName,
      studentPhone: finalStudentPhone,
      answers,
      score: scoreResult.score,
      totalScore: scoreResult.totalScore,
      submittedAt: new Date().toISOString(),
      proctoringReport: finalReport,
    };

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam.id,
          userId: user?.id || null,
          studentName: finalStudentName,
          studentPhone: finalStudentPhone,
          answers,
          proctoringReport: finalReport,
          isPreview,
        }),
      });
      const data = await res.json();
      if (data.success && data.submission) {
        finalSubmission = data.submission;
      }
    } catch (e) {
      console.warn('Submission API error, falling back to local storage', e);
    } finally {
      if (!isPreview) {
        saveSubmission(finalSubmission);
      }
      clearDraft(exam.id);
      // Seamlessly redirect to the dedicated Result & Analysis Page!
      router.push(`/exam/${exam.id}/result/${finalSubmission.id}${isPreview ? '?preview=true' : ''}`);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!exam) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Đang tải đề thi...
      </div>
    );
  }

  // Pre-exam Start Screen (Lobby)
  if (!hasStarted) {
    const hasPassword = Boolean(exam.settings?.password && exam.settings.password.trim() !== '');

    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center p-6">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FileText className="h-8 w-8" />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-900">{exam.title}</h1>
          <p className="mb-6 text-sm text-gray-500">
            Thời gian: <strong>{exam.durationMinutes} phút</strong> | Số lượng:{' '}
            <strong>{exam.totalQuestions} câu hỏi</strong> (Trắc nghiệm, Đúng/Sai, Trả lời ngắn)
          </p>

          {/* Teacher Preview Mode Banner if active */}
          {isPreview && (
            <div className="mb-6 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-left flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider">Chế độ Làm thử của Giáo viên (Test Run)</h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Bạn đang trải nghiệm đề thi với tư cách giáo viên. Kết quả thi và lịch sử làm bài sẽ không được ghi vào bảng điểm của học sinh hay ảnh hưởng đến thống kê xếp hạng.
                </p>
              </div>
            </div>
          )}

          {/* Mode Badge & Guidance Card */}
          {isProctoringEnabled ? (
            <div className="mb-6 rounded-xl bg-indigo-50/70 p-4 text-left border border-indigo-100 text-sm text-indigo-950">
              <div className="flex items-center gap-2 font-semibold text-indigo-900 mb-2">
                <Shield className="h-4 w-4 text-indigo-600" />
                <span>Quy chế thi có Giám sát Chống gian lận</span>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-xs text-indigo-900/80">
                <li>Hệ thống yêu cầu chế độ <strong>toàn màn hình (Fullscreen)</strong>.</li>
                <li>Hành vi chuyển tab hoặc thoát toàn màn hình sẽ được ghi nhận vào biên bản thi.</li>
                {maxViolations > 0 && (
                  <li>
                    Vi phạm vượt quá <strong>{maxViolations} lần</strong> sẽ bị hệ thống tự động cưỡng chế thu bài!
                  </li>
                )}
                <li>Khi hết giờ làm bài, hệ thống sẽ tự động thu bài thi.</li>
              </ul>
            </div>
          ) : (
            <div className="mb-6 rounded-xl bg-emerald-50/70 p-4 text-left border border-emerald-200 text-sm text-emerald-950">
              <div className="flex items-center gap-2 font-semibold text-emerald-900 mb-1">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span>Chế độ Ôn tập / Tự luyện</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Đề thi tự do không bật giám sát. Bạn có thể phóng to, thu nhỏ, tra cứu tài liệu và chuyển tab mà không bị tính vi phạm gian lận.
              </p>
            </div>
          )}

          {/* Timing notice if set */}
          {(exam.settings?.startTime || exam.settings?.endTime) && (
            <div className="mb-4 text-xs text-gray-500 flex items-center justify-center gap-3">
              {exam.settings?.startTime && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  Mở đề: {new Date(exam.settings.startTime).toLocaleString('vi-VN')}
                </span>
              )}
              {exam.settings?.endTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  Hạn nộp: {new Date(exam.settings.endTime).toLocaleString('vi-VN')}
                </span>
              )}
            </div>
          )}

          {/* Candidate Identity Section */}
          {user ? (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-center justify-between text-left">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user.fullName.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950">{user.fullName}</div>
                  <div className="text-[11px] text-emerald-700">SĐT: {user.phone}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                Đã xác thực
              </span>
            </div>
          ) : (
            <div className="mb-5 text-left space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Họ và tên thí sinh <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    placeholder="Nhập họ và tên của bạn để nộp bài..."
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                  <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Lớp / Số điện thoại <span className="text-gray-400 font-normal">(tùy chọn)</span>:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentPhone}
                    onChange={e => setStudentPhone(e.target.value)}
                    placeholder="Ví dụ: Lớp 12A1 hoặc 0912..."
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                  <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-0.5">
                <span>Đã có tài khoản N5Exam?</span>
                <Link
                  href={`/login?redirect=/exam/${exam.id}`}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition underline underline-offset-2 flex items-center gap-1"
                >
                  <LogIn className="h-3 w-3" />
                  <span>Đăng nhập tài khoản</span>
                </Link>
              </div>
            </div>
          )}

          {/* Password Gate if required */}
          {hasPassword && (
            <div className="mb-6 text-left">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Mật khẩu đề thi (PIN):
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu do giáo viên cung cấp..."
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
          )}

          {/* Access error message */}
          {accessError && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
              {accessError}
            </div>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleStartExam}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition"
            >
              <span>{isProctoringEnabled ? 'Bật Fullscreen & Bắt đầu thi' : 'Bắt đầu làm bài thi'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link
              href={`/exam/${exam.id}/print`}
              target="_blank"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 py-2.5 text-xs font-bold text-blue-800 hover:bg-blue-100 hover:border-blue-300 active:scale-95 transition shadow-2xs"
            >
              <Printer className="h-4 w-4 text-blue-600" />
              <span>In đề thi giấy & Tải file Word (.doc) 📄</span>
            </Link>
            <Link
              href={`/exam/${exam.id}/leaderboard`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50/90 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 hover:border-amber-400 active:scale-95 transition shadow-sm"
            >
              <Award className="h-4 w-4 text-amber-600" />
              <span>Xem Bảng Xếp Hạng & Điểm Cao 🏆</span>
            </Link>

            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Quay về Trang chủ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active Exam Taking Screen
  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Sticky Test Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-3 sm:px-6 py-2.5 sm:py-3 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {!isProctoringEnabled && (
              <Link
                href="/"
                className="flex items-center justify-center h-8 w-8 sm:w-auto sm:h-auto gap-1 rounded-lg border border-gray-200 bg-gray-50 sm:px-2.5 sm:py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition shrink-0"
                title="Quay về Trang chủ"
              >
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Trang chủ</span>
              </Link>
            )}

            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-gray-900 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-md">{exam.title}</h1>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                Thí sinh: <strong>{user?.fullName || studentName || 'Học sinh'}</strong>
              </p>
            </div>

            {/* Teacher Preview Badge */}
            {isPreview && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                <PlayCircle className="h-3 w-3 text-amber-600" />
                Làm thử
              </span>
            )}

            {/* Mode Indicator badge */}
            {isProctoringEnabled ? (
              <span className="hidden md:inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                <Shield className="h-3 w-3" />
                Giám sát
              </span>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                <BookOpen className="h-3 w-3" />
                Ôn tập tự do
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile Sheet Trigger */}
            <button
              type="button"
              onClick={() => setShowMobileNav(true)}
              className="lg:hidden flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50/80 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition active:scale-95"
              title="Mở danh sách câu hỏi"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden xs:inline">Câu hỏi</span>
              <span className="bg-indigo-600 text-white rounded-full text-[10px] px-1.5 py-0.2">
                {Object.keys(answers).length}/{displayQuestions.length}
              </span>
            </button>

            {/* Timer Badge */}
            <div
              className={`flex items-center gap-1 rounded-xl px-2.5 sm:px-3.5 py-1.5 font-mono text-xs sm:text-sm font-bold shadow-inner ${
                timeLeftSeconds < 300
                  ? 'bg-rose-50 text-rose-600 animate-pulse border border-rose-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}
            >
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>

            <button
              type="button"
              disabled={isAutoSubmitting || isSubmitting}
              onClick={() => setShowConfirmSubmit(true)}
              className="rounded-xl bg-indigo-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 touch-manipulation cursor-pointer"
            >
              {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
            </button>
          </div>
        </div>
      </header>

      {/* Sticky Progress Bar & View Mode Toggle */}
      <div className="sticky top-[53px] sm:top-[57px] z-10 border-b border-slate-200/80 bg-white/95 px-3 sm:px-6 py-2 backdrop-blur shadow-2xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span>Tiến độ:</span>
            <span className="text-indigo-600 font-bold">{Object.keys(answers).length}/{displayQuestions.length} câu</span>
            <span className="text-slate-400">({displayQuestions.length > 0 ? Math.round((Object.keys(answers).length / displayQuestions.length) * 100) : 0}%)</span>
            {flaggedIds.size > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full ml-1">
                <Flag className="w-3 h-3 text-amber-500 fill-amber-500" />
                {flaggedIds.size} cờ
              </span>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xem tất cả</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tập trung từng câu</span>
            </button>
          </div>
        </div>

        {/* Visual Progress Line */}
        <div className="mx-auto max-w-7xl mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
            style={{
              width: `${displayQuestions.length > 0 ? Math.round((Object.keys(answers).length / displayQuestions.length) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Main Examination Layout: 2 Columns */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Question List or Single Focus Card (3 Cols) */}
          <div className="space-y-4 lg:col-span-3">
            {viewMode === 'all' ? (
              displayQuestions.map((q, index) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  displayNumber={index + 1}
                  selectedOption={answers[q.id]}
                  isFlagged={flaggedIds.has(q.id)}
                  onSelectOption={val => handleSelectOption(q.id, val)}
                  onToggleFlag={() => handleToggleFlag(q.id)}
                  showAnswer={false}
                />
              ))
            ) : (
              displayQuestions[currentQuestionIndex] && (
                <div className="space-y-4">
                  <QuestionCard
                    key={displayQuestions[currentQuestionIndex].id}
                    question={displayQuestions[currentQuestionIndex]}
                    displayNumber={currentQuestionIndex + 1}
                    selectedOption={answers[displayQuestions[currentQuestionIndex].id]}
                    isFlagged={flaggedIds.has(displayQuestions[currentQuestionIndex].id)}
                    onSelectOption={val => handleSelectOption(displayQuestions[currentQuestionIndex].id, val)}
                    onToggleFlag={() => handleToggleFlag(displayQuestions[currentQuestionIndex].id)}
                    showAnswer={false}
                  />

                  {/* Single Mode Navigation Bar */}
                  <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
                    <button
                      type="button"
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Câu trước</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
                        Câu {currentQuestionIndex + 1} / {displayQuestions.length}
                      </span>
                      <span className="hidden md:inline text-[11px] text-slate-400">
                        (Dùng phím ← / →)
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={currentQuestionIndex >= displayQuestions.length - 1}
                      onClick={() => setCurrentQuestionIndex(prev => Math.min(displayQuestions.length - 1, prev + 1))}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-40 transition shadow-xs cursor-pointer"
                    >
                      <span>Câu tiếp theo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Navigation & Info Sidebar (1 Col) */}
          <div className="hidden lg:block space-y-4 lg:col-span-1">
            <QuestionNavGrid
              questions={displayQuestions}
              answers={answers}
              flaggedQuestionIds={flaggedIds}
              onSelectQuestion={handleJumpToQuestion}
            />

            {/* Anti-cheat or Practice card */}
            {isProctoringEnabled ? (
              <div className="rounded-xl border border-indigo-100 bg-white p-4 text-xs text-gray-600 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-indigo-900 mb-2">
                  <Shield className="h-4 w-4 text-indigo-600" />
                  <span>Quy chế giám sát</span>
                </div>
                <div className="space-y-1.5 text-gray-500">
                  <div className="flex justify-between">
                    <span>Rời màn hình:</span>
                    <strong className={report.outScreenCount > 0 ? 'text-amber-600' : 'text-gray-700'}>
                      {report.outScreenCount} / {maxViolations > 0 ? maxViolations : '∞'} lần
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Thoát toàn màn hình:</span>
                    <strong className={report.fullscreenExitCount > 0 ? 'text-amber-600' : 'text-gray-700'}>
                      {report.fullscreenExitCount} lần
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-100 bg-white p-4 text-xs text-gray-600 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-emerald-800 mb-1">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  <span>Chế độ Ôn tập</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Đề thi tự do không tính vi phạm. Bạn có thể tự ôn luyện và kiểm tra lại câu trả lời trước khi nộp.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

            {/* Mobile Bottom Sheet Drawer for Question Navigation */}
      {showMobileNav && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/50 backdrop-blur-xs lg:hidden animate-fade-in">
          <div className="w-full rounded-t-2xl bg-white p-4 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-indigo-600" />
                <span className="font-bold text-sm text-gray-900">Danh sách câu hỏi</span>
                <span className="text-xs text-gray-500 font-medium">({Object.keys(answers).length}/{displayQuestions.length} đã làm)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileNav(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-2">
              <QuestionNavGrid
                questions={displayQuestions}
                answers={answers}
                flaggedQuestionIds={flaggedIds}
                onSelectQuestion={(questionId) => {
                  setShowMobileNav(false);
                  handleJumpToQuestion(questionId);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for Mobile Question Grid */}
      <div className="fixed bottom-4 right-4 z-30 lg:hidden">
        <button
          type="button"
          onClick={() => setShowMobileNav(true)}
          className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-indigo-300 hover:bg-indigo-700 active:scale-95 transition cursor-pointer"
        >
          <LayoutGrid className="h-4 w-4" />
          <span>Bảng câu ({Object.keys(answers).length}/{displayQuestions.length})</span>
        </button>
      </div>

      {/* Warning Modal for Proctoring Violations */}
      <ProctoringModal
        isOpen={showWarningModal}
        violationCount={report.outScreenCount + report.fullscreenExitCount}
        maxViolations={maxViolations}
        isAutoSubmitting={isAutoSubmitting}
        latestViolation={latestViolation}
        onDismiss={async () => {
          setShowWarningModal(false);
          await requestFullscreen();
        }}
      />

      {/* Enhanced Confirmation Modal before Submit */}
      {showConfirmSubmit && (() => {
        const answeredCount = Object.keys(answers).length;
        const unansweredList = displayQuestions.filter(q => answers[q.id] === undefined || answers[q.id] === '');
        const flaggedList = displayQuestions.filter(q => flaggedIds.has(q.id));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  unansweredList.length > 0 ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}>
                  {unansweredList.length > 0 ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Rà soát trước khi Nộp bài</h3>
                  <p className="text-xs text-gray-500">Kiểm tra kỹ các câu hỏi trước khi xác nhận nộp bài</p>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-lg font-black text-slate-800">{answeredCount}/{displayQuestions.length}</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Đã làm</div>
                </div>
                <div className={`p-3 rounded-2xl border text-center ${
                  unansweredList.length > 0 ? 'bg-amber-50/80 border-amber-200 text-amber-800' : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                }`}>
                  <div className="text-lg font-black">{unansweredList.length}</div>
                  <div className="text-[11px] font-semibold mt-0.5">Chưa làm</div>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-center text-indigo-800">
                  <div className="text-lg font-black">{flaggedList.length}</div>
                  <div className="text-[11px] font-semibold mt-0.5">Đang gắn cờ</div>
                </div>
              </div>

              {/* Warning if unanswered */}
              {unansweredList.length > 0 && (
                <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Bạn còn {unansweredList.length} câu chưa trả lời:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                    {unansweredList.map((q) => {
                      const qIdx = displayQuestions.findIndex(x => x.id === q.id);
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            setShowConfirmSubmit(false);
                            handleJumpToQuestion(q.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                          title="Bấm để chuyển tới làm câu này"
                        >
                          Câu {qIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notice if flagged */}
              {flaggedList.length > 0 && (
                <div className="mb-4 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1.5">
                    <Flag className="w-4 h-4 text-indigo-600" />
                    <span>Các câu bạn đã gắn cờ xem lại ({flaggedList.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                    {flaggedList.map((q) => {
                      const qIdx = displayQuestions.findIndex(x => x.id === q.id);
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            setShowConfirmSubmit(false);
                            handleJumpToQuestion(q.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-indigo-300 text-indigo-900 font-bold text-xs hover:bg-indigo-100 transition shadow-2xs cursor-pointer"
                          title="Bấm để xem lại câu này"
                        >
                          Câu {qIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  {unansweredList.length > 0 ? 'Làm tiếp câu còn thiếu' : 'Tiếp tục rà soát'}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitExam()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md hover:shadow-indigo-200 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Đang nộp...' : 'Xác nhận nộp bài'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
