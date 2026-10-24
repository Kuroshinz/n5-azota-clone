'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Exam, Submission } from '../../../../types/exam';
import { getExam, saveExam, getSubmissions, saveSubmission } from '../../../../storage/examStorage';
import { QuestionCard } from '../../../../components/QuestionCard';
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
} from 'lucide-react';

export default function TeacherSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = (params?.id as string) || '';

  const [exam, setExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      .then(res => res.json())
      .then(data => {
        if (data.success && data.exam) {
          setExam(data.exam);
          saveExam(data.exam);
        }
      })
      .catch(() => {});

    fetch(`/api/submissions?examId=${examId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.submissions)) {
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
  }, [examId]);

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/teacher/exams')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                Báo cáo bài nộp & Giám sát thi: {exam?.title || 'Đề thi'}
              </h1>
              <p className="text-xs text-gray-500">
                Tổng số bài nộp: <strong>{submissions.length} bài thi</strong>
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
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Mở link phòng thi
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-6 pt-6">
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Users className="mb-3 h-12 w-12 text-gray-300" />
            <h2 className="text-base font-bold text-gray-800 mb-1">Chưa có bài nộp nào</h2>
            <p className="text-xs text-gray-500 max-w-sm mb-4">
              Học sinh chưa nộp bài cho đề thi này. Hãy chia sẻ link phòng thi để học sinh bắt đầu làm bài.
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Danh sách thí sinh ({submissions.length})
              </h2>

              <div className="space-y-2">
                {submissions.map(sub => {
                  const isSelected = selectedSub?.id === sub.id;
                  const hasViolations = sub.proctoringReport.outScreenCount > 0;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSub(sub)}
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 leading-tight">
                              {sub.studentName}
                            </h4>
                            <span className="text-[11px] text-gray-400">
                              {new Date(sub.submittedAt).toLocaleTimeString('vi-VN')}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-indigo-600 block">
                            {sub.score} <span className="text-[10px] text-gray-400">/ {sub.totalScore}</span>
                          </span>
                        </div>
                      </div>

                      {/* Cheating telemetry pill */}
                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-[11px]">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            hasViolations ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {hasViolations ? (
                            <>
                              <AlertTriangle className="h-3 w-3" />
                              <span>{sub.proctoringReport.outScreenCount} lần rời tab</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Thi nghiêm túc</span>
                            </>
                          )}
                        </span>

                        <span className="text-gray-400">
                          {Object.keys(sub.answers).length} câu đã làm
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detailed Scorecard & Answers of Selected Student */}
            <div className="space-y-6 lg:col-span-2">
              {selectedSub && (
                <>
                  {/* Student Summary Card */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                      <div>
                        <span className="text-xs text-gray-400 uppercase font-semibold block">Thí sinh</span>
                        <h3 className="text-lg font-bold text-gray-900">{selectedSub.studentName}</h3>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-xs text-gray-400 uppercase font-semibold block">Điểm số</span>
                          <span className="text-2xl font-black text-indigo-600">
                            {selectedSub.score} / {selectedSub.totalScore}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-gray-400 uppercase font-semibold block">Rời màn hình</span>
                          <span
                            className={`text-2xl font-black ${
                              selectedSub.proctoringReport.outScreenCount > 0
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {selectedSub.proctoringReport.outScreenCount} lần
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Proctoring Timeline Log */}
                    <div className="mt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-indigo-600" />
                        Nhật ký giám sát thi (Anti-Cheat Timeline)
                      </h4>

                      {selectedSub.proctoringReport.events.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">
                          Không có sự kiện bất thường nào trong quá trình làm bài.
                        </p>
                      ) : (
                        <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-xl bg-slate-50 p-3">
                          {selectedSub.proctoringReport.events.map((evt, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-gray-700">
                                {evt.type === 'out_screen'
                                  ? '⚠️ Rời màn hình / Chuyển tab'
                                  : evt.type === 'fullscreen_exit'
                                  ? '🚫 Thoát chế độ toàn màn hình'
                                  : 'Thông báo giám sát'}
                              </span>
                              <span className="font-mono text-[11px] text-gray-400">
                                {new Date(evt.timestamp).toLocaleTimeString('vi-VN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question details with student's answers */}
                  <div className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Chi tiết từng câu hỏi & Bài làm của thí sinh
                    </h2>

                    {exam &&
                      exam.questions.map(q => (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          selectedOption={selectedSub.answers[q.id]}
                          showAnswer={true}
                          readOnly={true}
                        />
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
