'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Exam, OptionKey, Submission } from '../../../types/exam';
import {
  getExam,
  saveExam,
  getDraft,
  saveDraft,
  clearDraft,
  calculateScore,
  saveSubmission,
} from '../../../storage/examStorage';
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
} from 'lucide-react';

const DEFAULT_SAMPLE_EXAM: Exam = {
  id: 'sample-exam-1',
  title: 'Đề thi trắc nghiệm Toán học & Khoa học Tự nhiên',
  durationMinutes: 15,
  totalQuestions: 4,
  createdAt: new Date().toISOString(),
  questions: [
    {
      id: 1,
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
      rawText: 'Câu 3...',
      content: 'Kim loại nào sau đây có tính dẫn điện tốt nhất ở điều kiện thường?',
      options: [
        { key: 'A', content: 'Đồng (Cu)' },
        { key: 'B', content: 'Bạc (Ag)' },
        { key: 'C', content: 'Vàng (Au)' },
        { key: 'D', content: 'Nhôm (Al)' },
      ],
      correctAnswer: 'B',
      explanation: 'Thứ tự dẫn điện giảm dần: Ag > Cu > Au > Al > Fe.',
      score: 2.5,
    },
    {
      id: 4,
      rawText: 'Câu 4...',
      content: 'Vận tốc ánh sáng trong chân không xấp xỉ bằng bao nhiêu?',
      options: [
        { key: 'A', content: '$3 \\times 10^8\\text{ m/s}$' },
        { key: 'B', content: '$3 \\times 10^5\\text{ m/s}$' },
        { key: 'C', content: '$340\\text{ m/s}$' },
        { key: 'D', content: '$1.5 \\times 10^8\\text{ m/s}$' },
      ],
      correctAnswer: 'A',
      explanation: 'Vận tốc ánh sáng trong chân không là $c \\approx 300\\,000\\text{ km/s} = 3 \\times 10^8\\text{ m/s}$.',
      score: 2.5,
    },
  ],
};

export default function ExamTakingPage() {
  const params = useParams();
  const examId = (params?.id as string) || 'sample-exam-1';

  const [exam, setExam] = useState<Exam | null>(null);
  const [studentName, setStudentName] = useState('Học sinh');
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);

  const [answers, setAnswers] = useState<Record<number, OptionKey>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(new Set());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Proctoring telemetry sensor
  const { report, latestViolation, requestFullscreen, isFullscreen, getReport } = useProctoring({
    enabled: hasStarted && !isSubmitted,
    onViolation: () => {
      setShowWarningModal(true);
    },
  });

  // Load exam and draft
  useEffect(() => {
    let currentExam = getExam(examId);
    if (!currentExam) {
      currentExam = { ...DEFAULT_SAMPLE_EXAM, id: examId };
      saveExam(currentExam);
    }
    setExam(currentExam);
    setTimeLeftSeconds(currentExam.durationMinutes * 60);

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
  const handleSelectOption = (questionId: number, key: OptionKey) => {
    if (isSubmitted) return;
    const nextAnswers = { ...answers, [questionId]: key };
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
    setHasStarted(true);
    await requestFullscreen();
  };

  const handleSubmitExam = () => {
    if (!exam || isSubmitted) return;

    const finalReport = getReport();
    const scoreResult = calculateScore(exam, answers);

    const sub: Submission = {
      id: `sub-${Date.now()}`,
      examId: exam.id,
      studentName: studentName || 'Học sinh',
      answers,
      score: scoreResult.score,
      totalScore: scoreResult.totalScore,
      submittedAt: new Date().toISOString(),
      proctoringReport: finalReport,
    };

    saveSubmission(sub);
    clearDraft(exam.id);
    setSubmission(sub);
    setIsSubmitted(true);
    setShowConfirmSubmit(false);
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

  // Pre-exam Start Screen
  if (!hasStarted) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center p-6">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FileText className="h-8 w-8" />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-900">{exam.title}</h1>
          <p className="mb-6 text-sm text-gray-500">
            Thời gian: <strong>{exam.durationMinutes} phút</strong> | Số lượng:{' '}
            <strong>{exam.totalQuestions} câu hỏi</strong>
          </p>

          <div className="mb-6 rounded-xl bg-indigo-50/70 p-4 text-left border border-indigo-100 text-sm text-indigo-950">
            <div className="flex items-center gap-2 font-semibold text-indigo-900 mb-2">
              <Shield className="h-4 w-4" />
              <span>Quy chế thi chống gian lận (Anti-cheat)</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-xs text-indigo-800/90">
              <li>Bài thi yêu cầu chuyển sang chế độ <strong>Toàn màn hình</strong>.</li>
              <li>Hành vi rời khỏi màn hình, mở tab khác hoặc ứng dụng khác sẽ bị ghi nhận lại.</li>
              <li>Hệ thống tự động lưu bài làm liên tục theo thời gian thực.</li>
            </ul>
          </div>

          <div className="mb-6 text-left">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Họ và tên thí sinh:
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="Nhập tên học sinh..."
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartExam}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 active:scale-[0.99] transition"
          >
            <span>Bắt đầu làm bài thi</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Post-exam Result Screen
  if (isSubmitted && submission) {
    const answeredCount = Object.keys(submission.answers).length;
    const correctCount = exam.questions.filter(
      q => q.correctAnswer && submission.answers[q.id] === q.correctAnswer
    ).length;

    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-10 w-10" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">NỘP BÀI THÀNH CÔNG</h2>
          <p className="text-sm text-gray-500 mb-6">Thí sinh: {submission.studentName} | {exam.title}</p>

          <div className="mx-auto grid max-w-md grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl bg-indigo-50 p-4 border border-indigo-100">
              <div className="text-2xl font-extrabold text-indigo-700">{submission.score}</div>
              <div className="text-xs text-indigo-900 font-medium">Điểm số / 10</div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
              <div className="text-2xl font-extrabold text-emerald-700">
                {correctCount}/{exam.totalQuestions}
              </div>
              <div className="text-xs text-emerald-900 font-medium">Số câu đúng</div>
            </div>
            <div className="rounded-xl bg-rose-50 p-4 border border-rose-100">
              <div className="text-2xl font-extrabold text-rose-700">
                {submission.proctoringReport.outScreenCount}
              </div>
              <div className="text-xs text-rose-900 font-medium">Lần vi phạm</div>
            </div>
          </div>

          {submission.proctoringReport.events.length > 0 && (
            <div className="mx-auto max-w-md rounded-xl bg-slate-50 p-4 text-left border border-slate-200 text-xs text-slate-700 mb-6">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <span>Nhật ký giám sát thi (Anti-cheat log)</span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {submission.proctoringReport.events.map((evt, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                    <span>{evt.type === 'out_screen' ? 'Rời màn hình' : evt.type}</span>
                    <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-left font-bold text-gray-900 mb-4 text-lg">Xem lại đáp án & Lời giải:</div>
          <div className="space-y-4 text-left">
            {exam.questions.map(q => (
              <QuestionCard
                key={q.id}
                question={q}
                selectedOption={submission.answers[q.id]}
                showAnswer={true}
                readOnly={true}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active Exam Room Layout
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Top Fixed Bar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 px-6 py-3 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-sm">
              A
            </span>
            <div>
              <h1 className="text-sm font-bold text-gray-900 sm:text-base leading-tight">{exam.title}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Thí sinh: <strong className="text-gray-700">{studentName}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Shield className="h-3 w-3" />
                  Giám sát chủ động
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-sm font-bold shadow-sm ${
                timeLeftSeconds < 180
                  ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-300'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
            >
              Nộp bài
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-6xl px-4 pt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Question List */}
          <div className="space-y-4 lg:col-span-3">
            {exam.questions.map(q => (
              <QuestionCard
                key={q.id}
                question={q}
                selectedOption={answers[q.id]}
                isFlagged={flaggedIds.has(q.id)}
                onSelectOption={key => handleSelectOption(q.id, key)}
                onToggleFlag={() => handleToggleFlag(q.id)}
              />
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <QuestionNavGrid
                totalQuestions={exam.totalQuestions}
                answers={answers}
                flaggedQuestionIds={flaggedIds}
                onSelectQuestion={id => {
                  const el = document.getElementById(`question-${id}`);
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              />

              {!isFullscreen && (
                <button
                  type="button"
                  onClick={() => requestFullscreen()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-100 transition"
                >
                  <Maximize2 className="h-4 w-4" />
                  <span>Vào chế độ toàn màn hình</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Proctoring Warning Modal */}
      <ProctoringModal
        isOpen={showWarningModal}
        violationCount={report.outScreenCount + report.fullscreenExitCount}
        latestViolation={latestViolation}
        onDismiss={() => {
          setShowWarningModal(false);
          requestFullscreen();
        }}
      />

      {/* Confirm Submission Dialog */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Xác nhận nộp bài?</h3>
            <p className="text-xs text-gray-500 mb-4">
              Bạn đã làm <strong>{answeredCount} / {exam.totalQuestions}</strong> câu hỏi. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="w-1/2 rounded-xl border border-gray-300 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Tiếp tục làm
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                className="w-1/2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700"
              >
                Đồng ý nộp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
