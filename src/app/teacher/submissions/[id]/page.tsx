'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Exam, Submission } from '../../../../types/exam';
import { getExam, getSubmissions } from '../../../../storage/examStorage';
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
} from 'lucide-react';

export default function TeacherSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = (params?.id as string) || '';

  const [exam, setExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  useEffect(() => {
    if (examId) {
      const e = getExam(examId);
      setExam(e);
      const subs = getSubmissions(examId);
      setSubmissions(subs);
      if (subs.length > 0) {
        setSelectedSub(subs[0]);
      }
    }
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
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-6">
        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <h3 className="text-base font-bold text-gray-800">Chưa có bài nộp nào cho đề thi này</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Chia sẻ liên kết đề thi cho học sinh để bắt đầu nhận bài nộp.
            </p>
            <Link
              href={`/exam/${examId}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Làm bài thi thử ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Submissions List */}
            <div className="space-y-3 lg:col-span-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                Danh sách thí sinh ({submissions.length})
              </h2>

              <div className="space-y-2">
                {submissions.map(sub => {
                  const isSelected = selectedSub?.id === sub.id;
                  const hasViolations = sub.proctoringReport.outScreenCount > 0 || sub.proctoringReport.fullscreenExitCount > 0;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSub(sub)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 shadow-sm ring-1 ring-indigo-600'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                          {sub.studentName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-gray-900">{sub.studentName}</div>
                          <div className="text-[11px] text-gray-400">
                            {new Date(sub.submittedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-indigo-700">{sub.score} đ</div>
                        {hasViolations ? (
                          <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-rose-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{sub.proctoringReport.outScreenCount} vi phạm</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-600 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Trung thực</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submission Detail & Anti-Cheat Audit */}
            <div className="space-y-4 lg:col-span-2">
              {selectedSub && (
                <>
                  {/* Telemetry Card */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{selectedSub.studentName}</h3>
                        <p className="text-xs text-gray-500">
                          Nộp lúc: {new Date(selectedSub.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-indigo-600">{selectedSub.score} / 10</div>
                        <div className="text-[11px] text-gray-400">Điểm tổng kết</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-center">
                        <div className="text-lg font-bold text-slate-800">
                          {selectedSub.proctoringReport.outScreenCount}
                        </div>
                        <div className="text-[11px] text-slate-500">Lần rời tab/cửa sổ</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-center">
                        <div className="text-lg font-bold text-slate-800">
                          {selectedSub.proctoringReport.fullscreenExitCount}
                        </div>
                        <div className="text-[11px] text-slate-500">Lần thoát toàn màn hình</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-center">
                        <div className="text-lg font-bold text-slate-800">
                          {selectedSub.proctoringReport.totalOutDurationSeconds}s
                        </div>
                        <div className="text-[11px] text-slate-500">Tổng thời gian ngoài tab</div>
                      </div>
                    </div>

                    {selectedSub.proctoringReport.events.length > 0 && (
                      <div className="rounded-xl bg-rose-50/70 p-3.5 border border-rose-200 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-rose-900 mb-2">
                          <ShieldAlert className="h-4 w-4" />
                          <span>Chi tiết nhật ký gian lận (Anti-cheat Timeline)</span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {selectedSub.proctoringReport.events.map((evt, i) => (
                            <div key={i} className="flex justify-between text-[11px] text-rose-800">
                              <span>• {evt.details || evt.type}</span>
                              <span className="font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Question Review List */}
                  {exam && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-gray-900">Chi tiết bài làm từng câu hỏi:</h3>
                      {exam.questions.map(q => (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          selectedOption={selectedSub.answers[q.id]}
                          showAnswer={true}
                          readOnly={true}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
