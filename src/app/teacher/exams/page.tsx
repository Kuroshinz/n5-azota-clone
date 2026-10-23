'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Exam } from '../../../types/exam';
import { listExams, saveExam, getSubmissions } from '../../../storage/examStorage';
import {
  BookOpen,
  Plus,
  Clock,
  HelpCircle,
  Copy,
  ExternalLink,
  Users,
  Check,
  Calendar,
} from 'lucide-react';

const SEED_EXAMS: Exam[] = [
  {
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
        score: 2.5,
      },
    ],
  },
];

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let currentExams = listExams();
    if (currentExams.length === 0) {
      SEED_EXAMS.forEach(e => saveExam(e));
      currentExams = listExams();
    }
    setExams(currentExams);
  }, []);

  const handleCopyLink = (examId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const examUrl = `${origin}/exam/${examId}`;
    navigator.clipboard.writeText(examUrl);
    setCopiedId(examId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 font-bold text-white shadow-md">
              A
            </span>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Azota - Quản lý đề thi của Giáo viên</h1>
              <p className="text-xs text-gray-500">Giám sát thi trực tuyến, nhận diện toán học và chấm tự động</p>
            </div>
          </div>

          <Link
            href="/teacher/create"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo đề thi mới</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <span>Danh sách đề thi ({exams.length})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map(exam => {
            const submissions = getSubmissions(exam.id);

            return (
              <div
                key={exam.id}
                className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug">
                      {exam.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      {exam.durationMinutes} phút
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                      {exam.totalQuestions} câu hỏi
                    </span>
                    <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                      <Users className="h-3.5 w-3.5" />
                      {submissions.length} bài nộp
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(exam.id)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition ${
                        copiedId === exam.id
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {copiedId === exam.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Đã sao chép link</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-gray-500" />
                          <span>Copy link thi</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/exam/${exam.id}`}
                      target="_blank"
                      className="flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                      title="Vào phòng thi thử"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <Link
                    href={`/teacher/submissions/${exam.id}`}
                    className="block w-full rounded-xl bg-slate-900 py-2 text-center text-xs font-semibold text-white hover:bg-slate-800 transition"
                  >
                    Xem kết quả bài nộp ({submissions.length})
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
