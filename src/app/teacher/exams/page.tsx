'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Exam } from '../../../types/exam';
import { listExams, saveExam, getSubmissions } from '../../../storage/examStorage';
import { ShareExamModal } from '../../../components/ShareExamModal';
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
  Share2,
  QrCode,
  Loader2,
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
  const [exams, setExams] = useState<Exam[]>(SEED_EXAMS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedShareExam, setSelectedShareExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Initial render from local cache for instant zero-flicker UI
    const localExams = listExams();
    if (localExams.length > 0) {
      setExams(localExams);
    }

    // 2. Fetch server database state via API
    setIsLoading(true);
    fetch('/api/exams')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.exams) && data.exams.length > 0) {
          setExams(data.exams);
          data.exams.forEach((e: Exam) => saveExam(e));
        } else if (localExams.length === 0) {
          SEED_EXAMS.forEach(e => {
            saveExam(e);
            fetch('/api/exams', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ exam: e }),
            }).catch(() => {});
          });
          setExams(SEED_EXAMS);
        }
      })
      .catch(err => {
        console.warn('Could not fetch exams from API, using local cache', err);
        if (localExams.length === 0) {
          SEED_EXAMS.forEach(e => saveExam(e));
          setExams(SEED_EXAMS);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
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
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo đề thi mới</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Danh sách đề thi</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Tất cả đề thi đã lưu trữ trên hệ thống cơ sở dữ liệu
            </p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Đang đồng bộ...</span>
            </div>
          )}
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams.map(exam => {
            const submissionsCount = getSubmissions(exam.id).length;
            const createdDate = new Date(exam.createdAt).toLocaleDateString('vi-VN');

            return (
              <div
                key={exam.id}
                className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-indigo-200"
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
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{submissionsCount} bài nộp</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(exam.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
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
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                      title="Chia sẻ mã QR & link"
                    >
                      <Share2 className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Chia sẻ</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/exam/${exam.id}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Thi thử</span>
                    </Link>

                    <Link
                      href={`/teacher/submissions/${exam.id}`}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Xem bài nộp</span>
                    </Link>
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
          isOpen={!!selectedShareExam}
          onClose={() => setSelectedShareExam(null)}
          examId={selectedShareExam.id}
          examTitle={selectedShareExam.title}
          durationMinutes={selectedShareExam.durationMinutes}
          totalQuestions={selectedShareExam.totalQuestions}
        />
      )}
    </div>
  );
}
