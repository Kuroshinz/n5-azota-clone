'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Exam, Question, Submission, StudentAnswerValue, DEFAULT_EXAM_SETTINGS } from '../../../../../types/exam';
import { getExam, getSubmission, saveExam, saveSubmission } from '../../../../../storage/examStorage';
import { MathView } from '../../../../../components/MathView';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  Home,
  Printer,
  Shield,
  ShieldAlert,
  Award,
  FileText,
  Check,
  X,
  HelpCircle,
  User,
  Calendar,
  Clock,
  BookOpen,
  EyeOff,
  Filter,
} from 'lucide-react';

type QuestionStatus = 'correct' | 'wrong' | 'unanswered';

interface EvaluatedQuestion {
  question: Question;
  displayNumber: number;
  status: QuestionStatus;
  earnedScore: number;
  maxScore: number;
  studentAnswer: StudentAnswerValue | undefined;
}

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const examId = (params?.id as string) || '';
  const subId = (params?.subId as string) || '';

  const [exam, setExam] = useState<Exam | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'correct' | 'wrong' | 'unanswered'>('all');

  // Load exam and submission data
  useEffect(() => {
    if (!examId || !subId) return;

    // 1. Initial attempt from localStorage
    const localExam = getExam(examId);
    if (localExam) setExam(localExam);

    const localSub = getSubmission(subId);
    if (localSub) setSubmission(localSub);

    // 2. Fetch from server API
    Promise.all([
      fetch(`/api/exams/${examId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.exam) {
            setExam(data.exam);
            saveExam(data.exam);
          }
        })
        .catch(() => {}),

      fetch(`/api/submissions/${subId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.submission) {
            setSubmission(data.submission);
            saveSubmission(data.submission);
          }
        })
        .catch(() => {}),
    ]).finally(() => {
      setLoading(false);
    });
  }, [examId, subId]);

  // Evaluate each question for status and score breakdown
  const evaluatedQuestions = useMemo<EvaluatedQuestion[]>(() => {
    if (!exam || !submission) return [];

    return exam.questions.map((q, idx) => {
      const studentAns = submission.answers?.[q.id];
      const maxScore = q.score || 2.5;
      const qType = q.type || 'multiple_choice';

      // Check unanswered
      const isUnanswered =
        studentAns === undefined ||
        studentAns === null ||
        (typeof studentAns === 'string' && studentAns.trim() === '') ||
        (typeof studentAns === 'object' && Object.keys(studentAns).length === 0);

      if (isUnanswered) {
        return {
          question: q,
          displayNumber: idx + 1,
          status: 'unanswered',
          earnedScore: 0,
          maxScore,
          studentAnswer: studentAns,
        };
      }

      // Check multiple choice
      if (qType === 'multiple_choice') {
        const isCorrect =
          typeof studentAns === 'string' &&
          q.correctAnswer &&
          studentAns.trim().toUpperCase() === q.correctAnswer.toUpperCase();

        return {
          question: q,
          displayNumber: idx + 1,
          status: isCorrect ? 'correct' : 'wrong',
          earnedScore: isCorrect ? maxScore : 0,
          maxScore,
          studentAnswer: studentAns,
        };
      }

      // Check true / false
      if (qType === 'true_false' && q.subItems && q.subItems.length > 0) {
        const studentTf = typeof studentAns === 'object' ? (studentAns as Record<string, boolean>) : {};
        let matchingCount = 0;
        for (const sub of q.subItems) {
          if (sub.correctAnswer !== undefined && studentTf[sub.key] === sub.correctAnswer) {
            matchingCount += 1;
          }
        }

        let ratio = 0;
        if (matchingCount === 1) ratio = 0.1;
        else if (matchingCount === 2) ratio = 0.25;
        else if (matchingCount === 3) ratio = 0.5;
        else if (matchingCount === 4) ratio = 1.0;

        const earned = Number((ratio * maxScore).toFixed(2));
        const status: QuestionStatus = matchingCount === 4 ? 'correct' : 'wrong';

        return {
          question: q,
          displayNumber: idx + 1,
          status,
          earnedScore: earned,
          maxScore,
          studentAnswer: studentAns,
        };
      }

      // Check short answer
      if (qType === 'short_answer' && q.acceptedAnswers && q.acceptedAnswers.length > 0) {
        const norm = (s: string) => s.trim().replace(/,/g, '.').toLowerCase();
        const isMatch = typeof studentAns === 'string' && q.acceptedAnswers.some(a => norm(a) === norm(studentAns));

        return {
          question: q,
          displayNumber: idx + 1,
          status: isMatch ? 'correct' : 'wrong',
          earnedScore: isMatch ? maxScore : 0,
          maxScore,
          studentAnswer: studentAns,
        };
      }

      return {
        question: q,
        displayNumber: idx + 1,
        status: 'wrong',
        earnedScore: 0,
        maxScore,
        studentAnswer: studentAns,
      };
    });
  }, [exam, submission]);

  // Counts for filters
  const correctCount = evaluatedQuestions.filter(q => q.status === 'correct').length;
  const wrongCount = evaluatedQuestions.filter(q => q.status === 'wrong').length;
  const unansweredCount = evaluatedQuestions.filter(q => q.status === 'unanswered').length;
  const totalQuestions = evaluatedQuestions.length;

  // Filtered list
  const filteredQuestions = useMemo(() => {
    if (activeFilter === 'correct') return evaluatedQuestions.filter(q => q.status === 'correct');
    if (activeFilter === 'wrong') return evaluatedQuestions.filter(q => q.status === 'wrong');
    if (activeFilter === 'unanswered') return evaluatedQuestions.filter(q => q.status === 'unanswered');
    return evaluatedQuestions;
  }, [evaluatedQuestions, activeFilter]);

  if (loading && (!exam || !submission)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-semibold text-gray-600">Đang tải kết quả bài thi...</p>
        </div>
      </div>
    );
  }

  if (!submission || !exam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm max-w-md w-full">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-rose-500" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Không tìm thấy bài làm</h2>
          <p className="text-xs text-gray-500 mb-6">
            Không tìm thấy thông tin bài nộp này. Có thể liên kết không chính xác hoặc dữ liệu đã được làm mới.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/exam/${examId}`}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
            >
              Vào phòng thi
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const policy = exam.settings?.showResultAfterSubmit || 'score_and_answers';
  const score = submission.score;
  const totalScore = submission.totalScore || 10;
  const scorePercent = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;

  // Grade classification
  const gradeLabel =
    score >= 8.5 ? 'Xuất sắc' : score >= 7.0 ? 'Giỏi' : score >= 5.0 ? 'Đạt' : 'Cần cố gắng';
  const gradeColor =
    score >= 8.5
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : score >= 7.0
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : score >= 5.0
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 sm:px-6 py-3.5 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition shadow-sm"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1">
                Kết quả thi: {exam.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Thí sinh: <strong className="text-gray-800">{submission.studentName}</strong></span>
                {submission.studentPhone && <span>• SĐT: {submission.studentPhone}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In kết quả</span>
            </button>
            <Link
              href={`/exam/${exam.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thi lại đề này</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
        {/* HERO SCORE & OVERVIEW CARD */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
            {/* Left: Big Score Display */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
              {policy !== 'hidden' ? (
                <>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Điểm số bài làm
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-5xl font-black text-indigo-600 tracking-tight">
                      {score.toFixed(2)}
                    </span>
                    <span className="text-lg font-bold text-gray-400">
                      / {totalScore}
                    </span>
                  </div>
                  <div className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold border mt-2 ${gradeColor}`}>
                    <Award className="h-3.5 w-3.5" />
                    <span>Xếp loại: {gradeLabel}</span>
                  </div>
                </>
              ) : (
                <div className="py-4">
                  <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                    <EyeOff className="h-7 w-7" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">Kết quả được ẩn</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Giáo viên cài đặt ẩn điểm và đáp án. Điểm số sẽ được thông báo sau.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Detailed Summary Metrics */}
            <div className="md:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-gray-900">{exam.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      Nộp lúc: {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      Thời lượng: {exam.durationMinutes} phút
                    </span>
                  </div>
                </div>

                {/* Proctoring summary badge */}
                {submission.proctoringReport?.outScreenCount > 0 ? (
                  <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200">
                    <ShieldAlert className="h-4 w-4" />
                    <span>{submission.proctoringReport.outScreenCount} lần rời màn hình</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <Shield className="h-4 w-4" />
                    <span>Không phát hiện vi phạm</span>
                  </div>
                )}
              </div>

              {/* 3 Metric Pills: Correct, Wrong, Unanswered */}
              {policy === 'score_and_answers' && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-center transition hover:bg-emerald-50">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Câu đúng</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-700 mt-1">
                      {correctCount}{' '}
                      <span className="text-xs font-normal text-emerald-600">/ {totalQuestions}</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
                    </div>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-center transition hover:bg-rose-50">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center justify-center gap-1">
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Câu sai</span>
                    </div>
                    <div className="text-2xl font-black text-rose-700 mt-1">
                      {wrongCount}{' '}
                      <span className="text-xs font-normal text-rose-600">/ {totalQuestions}</span>
                    </div>
                    <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                      {totalQuestions > 0 ? Math.round((wrongCount / totalQuestions) * 100) : 0}%
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center transition hover:bg-slate-100/70">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>Chưa làm</span>
                    </div>
                    <div className="text-2xl font-black text-slate-700 mt-1">
                      {unansweredCount}{' '}
                      <span className="text-xs font-normal text-slate-500">/ {totalQuestions}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      {totalQuestions > 0 ? Math.round((unansweredCount / totalQuestions) * 100) : 0}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* POLICY NOTICES */}
        {policy === 'hidden' && (
          <div className="rounded-2xl border border-indigo-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Bài thi đã nộp thành công!</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Giáo viên đã cài đặt ẩn kết quả và đáp án chi tiết cho bài thi này.
              Bài làm của bạn đã được ghi nhận vào hệ thống một cách an toàn.
            </p>
          </div>
        )}

        {policy === 'score_only' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-indigo-500" />
            <h3 className="text-base font-bold text-gray-900 mb-1">Chế độ xem điểm tổng quan</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Giáo viên chỉ cho phép xem điểm tổng kết bài làm và ẩn phần đáp án chi tiết của từng câu hỏi.
            </p>
          </div>
        )}

        {/* FULL QUESTIONS REVIEW WITH CLASSIFICATION TABS */}
        {policy === 'score_and_answers' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Left 3 Cols: Filter tabs + Question cards */}
            <div className="space-y-4 lg:col-span-3">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span>Tất cả ({totalQuestions})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('correct')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                    activeFilter === 'correct'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Câu đúng ({correctCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('wrong')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                    activeFilter === 'wrong'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                  }`}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Câu sai ({wrongCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('unanswered')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                    activeFilter === 'unanswered'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Chưa làm ({unansweredCount})</span>
                </button>
              </div>

              {/* Notice if no questions match filter */}
              {filteredQuestions.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                  <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-500" />
                  <p className="text-sm font-bold text-gray-800">
                    {activeFilter === 'wrong'
                      ? 'Tuyệt vời! Bạn không làm sai câu nào!'
                      : activeFilter === 'unanswered'
                      ? 'Bạn đã trả lời đầy đủ tất cả câu hỏi!'
                      : 'Không có câu hỏi nào trong mục này.'}
                  </p>
                </div>
              )}

              {/* Questions List */}
              {filteredQuestions.map((item) => {
                const q = item.question;
                const studentAns = item.studentAnswer;
                const qType = q.type || 'multiple_choice';

                return (
                  <div
                    key={q.id}
                    id={`question-${q.id}`}
                    className={`rounded-2xl border p-5 shadow-sm transition bg-white ${
                      item.status === 'correct'
                        ? 'border-emerald-300 ring-1 ring-emerald-100'
                        : item.status === 'wrong'
                        ? 'border-rose-300 ring-1 ring-rose-100'
                        : 'border-gray-200'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 font-black text-xs text-indigo-700">
                          {item.displayNumber}
                        </span>
                        <span className="text-xs font-bold text-gray-800">
                          {qType === 'multiple_choice'
                            ? 'Trắc nghiệm 4 lựa chọn'
                            : qType === 'true_false'
                            ? 'Đúng / Sai 4 ý'
                            : 'Trả lời ngắn'}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({item.earnedScore.toFixed(2)} / {item.maxScore} đ)
                        </span>
                      </div>

                      {/* Status Badge */}
                      {item.status === 'correct' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>ĐÚNG (+{item.earnedScore.toFixed(2)} đ)</span>
                        </span>
                      ) : item.status === 'wrong' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>SAI (0 đ)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>CHƯA LÀM (0 đ)</span>
                        </span>
                      )}
                    </div>

                    {/* Question Content */}
                    <div className="mb-4 text-sm sm:text-base font-medium text-gray-900 leading-relaxed">
                      <MathView content={q.content} />
                    </div>

                    {/* MODE 1: MULTIPLE CHOICE */}
                    {qType === 'multiple_choice' && q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {q.options.map((opt) => {
                          const isStudentSelected = studentAns === opt.key;
                          const isCorrectOption = q.correctAnswer === opt.key;

                          let cardClass = 'border-gray-200 bg-gray-50/50 text-gray-700';
                          let badgeContent = null;

                          if (isCorrectOption) {
                            cardClass = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold ring-1 ring-emerald-400';
                            badgeContent = (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                <Check className="h-3.5 w-3.5" />
                                <span>Đáp án đúng</span>
                              </span>
                            );
                          } else if (isStudentSelected && !isCorrectOption) {
                            cardClass = 'border-rose-400 bg-rose-50/80 text-rose-950 font-medium line-through';
                            badgeContent = (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700">
                                <X className="h-3.5 w-3.5" />
                                <span>Bạn chọn (Sai)</span>
                              </span>
                            );
                          }

                          return (
                            <div
                              key={opt.key}
                              className={`flex items-start justify-between gap-3 rounded-xl border p-3 transition ${cardClass}`}
                            >
                              <div className="flex items-start gap-2.5 flex-1">
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                    isCorrectOption
                                      ? 'bg-emerald-600 text-white'
                                      : isStudentSelected
                                      ? 'bg-rose-600 text-white'
                                      : 'border border-gray-300 bg-white text-gray-700'
                                  }`}
                                >
                                  {opt.key}
                                </span>
                                <div className="text-sm pt-0.5">
                                  <MathView content={opt.content} />
                                </div>
                              </div>
                              {badgeContent}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* MODE 2: TRUE / FALSE */}
                    {qType === 'true_false' && q.subItems && q.subItems.length > 0 && (
                      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white text-xs">
                        <div className="grid grid-cols-12 bg-slate-50 px-3.5 py-2 font-bold text-slate-600 border-b border-gray-200">
                          <span className="col-span-6 sm:col-span-7">Mệnh đề khẳng định</span>
                          <span className="col-span-3 sm:col-span-2 text-center">Bạn chọn</span>
                          <span className="col-span-3 sm:col-span-3 text-center">Đáp án đúng</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {q.subItems.map((sub) => {
                            const tfAns = typeof studentAns === 'object' ? (studentAns as Record<string, boolean>) : {};
                            const userChoice = tfAns[sub.key];
                            const isSubCorrect = userChoice !== undefined && userChoice === sub.correctAnswer;

                            return (
                              <div key={sub.key} className="grid grid-cols-12 items-center px-3.5 py-2.5 gap-2">
                                <div className="col-span-6 sm:col-span-7 flex items-start gap-2">
                                  <span className="font-bold text-indigo-600">{sub.key})</span>
                                  <div className="flex-1 text-gray-800">
                                    <MathView content={sub.content} />
                                  </div>
                                </div>

                                <div className="col-span-3 sm:col-span-2 text-center">
                                  {userChoice === true ? (
                                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-bold text-[11px] ${isSubCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                      {isSubCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                      Đúng
                                    </span>
                                  ) : userChoice === false ? (
                                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-bold text-[11px] ${isSubCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                      {isSubCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                      Sai
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">--</span>
                                  )}
                                </div>

                                <div className="col-span-3 sm:col-span-3 text-center">
                                  <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${sub.correctAnswer ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {sub.correctAnswer ? 'Đúng' : 'Sai'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* MODE 3: SHORT ANSWER */}
                    {qType === 'short_answer' && (
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="font-semibold text-gray-500">Câu trả lời của bạn:</span>
                          <span className={`rounded-lg px-3 py-1 font-bold text-sm ${item.status === 'correct' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {typeof studentAns === 'string' && studentAns.trim() ? studentAns : '(Chưa điền đáp án)'}
                          </span>
                        </div>
                        {q.acceptedAnswers && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>
                              Đáp số chuẩn xác:{' '}
                              <strong className="text-emerald-800">{q.acceptedAnswers.join(' hoặc ')}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DETAILED EXPLANATION */}
                    {q.explanation && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs sm:text-sm text-gray-800">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1.5">
                          <span>💡 Lời giải chi tiết:</span>
                        </div>
                        <div className="leading-relaxed">
                          <MathView content={q.explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right 1 Col: Quick Navigation Jump Grid */}
            <div className="space-y-4 lg:col-span-1">
              <div className="sticky top-20 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Danh sách câu hỏi ({totalQuestions})
                </h3>

                {/* Question matrix jump buttons */}
                <div className="grid grid-cols-5 gap-2">
                  {evaluatedQuestions.map((q) => {
                    let btnColor = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
                    if (q.status === 'correct') {
                      btnColor = 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700';
                    } else if (q.status === 'wrong') {
                      btnColor = 'bg-rose-600 text-white shadow-sm hover:bg-rose-700';
                    }

                    return (
                      <button
                        key={q.question.id}
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`question-${q.question.id}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={`flex h-9 w-full items-center justify-center rounded-xl text-xs font-bold transition cursor-pointer ${btnColor}`}
                        title={`Câu ${q.displayNumber}: ${q.status === 'correct' ? 'Đúng' : q.status === 'wrong' ? 'Sai' : 'Chưa làm'}`}
                      >
                        {q.displayNumber}
                      </button>
                    );
                  })}
                </div>

                {/* Legend indicator */}
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-[11px] text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-md bg-emerald-600 inline-block" />
                      <span>Câu đúng ({correctCount})</span>
                    </span>
                    <strong className="text-emerald-700">
                      {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-md bg-rose-600 inline-block" />
                      <span>Câu sai ({wrongCount})</span>
                    </span>
                    <strong className="text-rose-700">
                      {totalQuestions > 0 ? Math.round((wrongCount / totalQuestions) * 100) : 0}%
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-md bg-slate-200 inline-block" />
                      <span>Chưa làm ({unansweredCount})</span>
                    </span>
                    <strong className="text-slate-600">
                      {totalQuestions > 0 ? Math.round((unansweredCount / totalQuestions) * 100) : 0}%
                    </strong>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3">
                  <Link
                    href={`/exam/${exam.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-50 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Làm lại bài thi</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
