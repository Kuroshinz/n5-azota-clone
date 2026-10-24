'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
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
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  Maximize2,
  FileText,
  User,
  ArrowRight,
  ShieldAlert,
  Loader2,
  BookOpen,
  Lock,
  Shuffle,
  EyeOff,
  Calendar,
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
  const examId = (params?.id as string) || 'sample-exam-1';

  const [exam, setExam] = useState<Exam>(DEFAULT_SAMPLE_EXAM);
  const [displayQuestions, setDisplayQuestions] = useState<Question[]>(DEFAULT_SAMPLE_EXAM.questions);
  const [studentName, setStudentName] = useState('Học sinh');
  const [passwordInput, setPasswordInput] = useState('');
  const [accessError, setAccessError] = useState<string | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);

  const [answers, setAnswers] = useState<Record<number, StudentAnswerValue>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(new Set());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(20 * 60);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const isProctoringEnabled = Boolean(exam.settings?.enableProctoring);
  const maxViolations = exam.settings?.maxViolations ?? 3;

  // Proctoring telemetry sensor
  const { report, latestViolation, requestFullscreen, isFullscreen, getReport } = useProctoring({
    enabled: hasStarted && !isSubmitted && isProctoringEnabled,
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
          setDisplayQuestions(data.exam.questions);
          setTimeLeftSeconds(data.exam.durationMinutes * 60);
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
    if (!hasStarted || isSubmitted) return;

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
  }, [hasStarted, isSubmitted]);

  // Answer selection & auto-save
  const handleSelectOption = (questionId: number, val: StudentAnswerValue) => {
    if (isSubmitted || isAutoSubmitting) return;
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
    // Validate access
    const check = validateExamAccess(exam.settings, passwordInput);
    if (!check.allowed) {
      if (check.reason === 'invalid_password') {
        setAccessError('Mật khẩu đề thi không đúng. Vui lòng kiểm tra lại!');
      } else if (check.reason === 'not_started') {
        setAccessError('Chưa đến thời gian mở đề thi!');
      } else if (check.reason === 'ended') {
        setAccessError('Đề thi đã quá hạn chót nộp bài!');
      }
      return;
    }

    setAccessError(null);

    // Apply shuffling
    const shuffled = shuffleExamQuestions(
      exam.questions,
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
    if (!exam || isSubmitted || isSubmitting) return;

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

    let finalSubmission: Submission = {
      id: `sub-${Date.now()}`,
      examId: exam.id,
      studentName: studentName || 'Học sinh',
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
          studentName: studentName || 'Học sinh',
          answers,
          proctoringReport: finalReport,
        }),
      });
      const data = await res.json();
      if (data.success && data.submission) {
        finalSubmission = data.submission;
      }
    } catch (e) {
      console.warn('Submission API error, falling back to local storage', e);
    } finally {
      saveSubmission(finalSubmission);
      clearDraft(exam.id);
      setSubmission(finalSubmission);
      setIsSubmitted(true);
      setIsSubmitting(false);
      setIsAutoSubmitting(false);
      setShowConfirmSubmit(false);
      setShowWarningModal(false);
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
                Đề thi không bật giám sát. Bạn có thể tự do phóng to, thu nhỏ, tra cứu tài liệu và chuyển tab mà không bị tính vi phạm gian lận.
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

          {/* Student name */}
          <div className="mb-4 text-left">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Họ và tên thí sinh:
            </label>
            <div className="relative">
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="Nhập họ và tên của bạn..."
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

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

          <button
            type="button"
            onClick={handleStartExam}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition"
          >
            <span>{isProctoringEnabled ? 'Bật Fullscreen & Bắt đầu thi' : 'Bắt đầu làm bài thi'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Post-submission Review Screen
  if (isSubmitted && submission) {
    const policy = exam.settings?.showResultAfterSubmit || 'score_and_answers';
    const scoreColor =
      submission.score >= 8
        ? 'text-emerald-600'
        : submission.score >= 5
        ? 'text-indigo-600'
        : 'text-amber-600';

    return (
      <div className="min-h-screen bg-slate-100 pb-16">
        {/* Top Header Result */}
        <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                Kết quả bài thi: {exam.title}
              </h1>
              <p className="text-xs text-gray-500">
                Thí sinh: <strong>{submission.studentName}</strong> | Nộp lúc:{' '}
                {new Date(submission.submittedAt).toLocaleTimeString('vi-VN')}
              </p>
            </div>

            {policy !== 'hidden' ? (
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-400 block uppercase">Điểm số đạt được</span>
                <span className={`text-2xl font-black ${scoreColor}`}>
                  {submission.score} / {submission.totalScore}
                </span>
              </div>
            ) : (
              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  <EyeOff className="h-3.5 w-3.5" />
                  Kết quả được ẩn
                </span>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 pt-6">
          {/* Policy = Hidden notice */}
          {policy === 'hidden' && (
            <div className="mb-6 rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm text-center">
              <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
              <h3 className="text-base font-bold text-gray-900 mb-1">Bài thi đã nộp thành công!</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Giáo viên đã cài đặt ẩn điểm và đáp án. Điểm số của bạn sẽ được thông báo sau khi giáo viên công bố kết quả.
              </p>
            </div>
          )}

          {/* Proctoring telemetry summary badge */}
          {isProctoringEnabled && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    submission.proctoringReport.outScreenCount > 0
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {submission.proctoringReport.outScreenCount > 0 ? (
                    <ShieldAlert className="h-6 w-6" />
                  ) : (
                    <CheckCircle className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {submission.proctoringReport.outScreenCount > 0
                      ? `Phát hiện ${submission.proctoringReport.outScreenCount} lần chuyển màn hình`
                      : 'Không phát hiện vi phạm quy chế thi'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Thoát toàn màn hình: {submission.proctoringReport.fullscreenExitCount} lần | Tổng thời gian rời phòng: {submission.proctoringReport.totalOutDurationSeconds}s
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Làm lại bài thi
              </button>
            </div>
          )}

          {/* Policy = Score Only Notice */}
          {policy === 'score_only' && (
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-center">
              <p className="text-xs text-gray-500">
                Giáo viên chỉ cho phép xem điểm số và ẩn phần giải thích đáp án chi tiết của từng câu hỏi.
              </p>
            </div>
          )}

          {/* Full Solutions Review (Only if policy === score_and_answers) */}
          {policy === 'score_and_answers' && (
            <div className="space-y-4">
              {displayQuestions.map(q => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  selectedOption={answers[q.id]}
                  showAnswer={true}
                  readOnly={true}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Active Exam Taking Screen
  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Sticky Test Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-6 py-3 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-bold text-gray-900 line-clamp-1">{exam.title}</h1>
              <p className="text-xs text-gray-500">
                Thí sinh: <strong>{studentName}</strong>
              </p>
            </div>

            {/* Mode Indicator badge */}
            {isProctoringEnabled ? (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                <Shield className="h-3 w-3" />
                Giám sát
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                <BookOpen className="h-3 w-3" />
                Ôn tập tự do
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Timer Badge */}
            <div
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-sm font-bold shadow-inner ${
                timeLeftSeconds < 300
                  ? 'bg-rose-50 text-rose-600 animate-pulse border border-rose-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>

            <button
              type="button"
              disabled={isAutoSubmitting}
              onClick={() => setShowConfirmSubmit(true)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
            >
              Nộp bài thi
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Layout: 2 Columns */}
      <main className="mx-auto max-w-7xl px-6 pt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Question List (3 Cols) */}
          <div className="space-y-4 lg:col-span-3">
            {displayQuestions.map(q => (
              <QuestionCard
                key={q.id}
                question={q}
                selectedOption={answers[q.id]}
                isFlagged={flaggedIds.has(q.id)}
                onSelectOption={val => handleSelectOption(q.id, val)}
                onToggleFlag={() => handleToggleFlag(q.id)}
                showAnswer={false}
              />
            ))}
          </div>

          {/* Navigation & Info Sidebar (1 Col) */}
          <div className="space-y-4 lg:col-span-1">
            <QuestionNavGrid
              totalQuestions={displayQuestions.length}
              answers={answers}
              flaggedQuestionIds={flaggedIds}
              onSelectQuestion={questionId => {
                const el = document.getElementById(`question-${questionId}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            />

            {/* Anti-cheat or Practice card */}
            {isProctoringEnabled ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm text-xs">
                <div className="flex items-center gap-2 font-bold text-gray-800 mb-2">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <span>Giám sát thi trực tuyến</span>
                </div>
                <p className="text-gray-500 mb-2">
                  Số lần chuyển màn hình: <strong className="text-indigo-600">{report.outScreenCount}</strong>
                  {maxViolations > 0 && <span> / {maxViolations}</span>}
                </p>
                {!isFullscreen && (
                  <button
                    type="button"
                    onClick={() => requestFullscreen()}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 py-1.5 font-semibold text-amber-800 hover:bg-amber-100 transition"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Bật lại toàn màn hình</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  <span>Chế độ Ôn tập</span>
                </div>
                <p className="text-emerald-700 text-[11px] leading-relaxed">
                  Bạn có thể mở tài liệu tham khảo hoặc chuyển cửa sổ mà không bị tính vi phạm gian lận.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Proctoring Violation Warning Modal */}
      {isProctoringEnabled && (
        <ProctoringModal
          isOpen={showWarningModal}
          violationCount={report.outScreenCount + report.fullscreenExitCount}
          maxViolations={maxViolations}
          isAutoSubmitting={isAutoSubmitting}
          latestViolation={latestViolation}
          onDismiss={() => setShowWarningModal(false)}
        />
      )}

      {/* Confirm Submit Dialog Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
            <h3 className="text-base font-bold text-gray-900 mb-1">Xác nhận nộp bài?</h3>
            <p className="text-xs text-gray-500 mb-5">
              Bạn đã làm được{' '}
              <strong className="text-indigo-600">{Object.keys(answers).length}</strong> /{' '}
              {exam.totalQuestions} câu. Bạn có chắc chắn muốn kết thúc bài thi?
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitExam()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang nộp...</span>
                  </>
                ) : (
                  <span>Đồng ý nộp</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
