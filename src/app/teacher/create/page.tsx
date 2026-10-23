'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { parseExamText } from '../../../parser/examParser';
import { saveExam } from '../../../storage/examStorage';
import { QuestionCard } from '../../../components/QuestionCard';
import {
  FilePlus,
  Sparkles,
  Save,
  Clock,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const SAMPLE_TEMPLATE = `ĐỀ THI KIỂM TRA ĐỊNH KỲ MÔN TOÁN 11

Câu 1: Cho hàm số $f(x) = x^3 - 3x + 2$. Tìm đạo hàm $f'(x)$.
A. $f'(x) = 3x^2 - 3$
B. $f'(x) = 3x^2 + 3$
C. $f'(x) = x^2 - 3$
D. $f'(x) = 3x^2$
Đáp án: A
Hướng dẫn giải:
Ta áp dụng công thức đạo hàm cơ bản $(x^n)' = n x^{n-1}$.
Do đó $(x^3 - 3x + 2)' = 3x^2 - 3$.

Câu 2: Nghiệm của phương trình lượng giác $\\sin x = \\frac{1}{2}$ trong khoảng $(0; \\pi)$ là:
*A. $x = \\frac{\\pi}{6}$ và $x = \\frac{5\\pi}{6}$
B. $x = \\frac{\\pi}{3}$
C. $x = \\frac{2\\pi}{3}$
D. $x = \\frac{\\pi}{4}$

Câu 3: Một cấp số cộng có số hạng đầu $u_1 = 3$ và công sai $d = 2$. Tính $u_5$.
A. $u_5 = 9$
*B. $u_5 = 11$
C. $u_5 = 13$
D. $u_5 = 15$
Hướng dẫn giải:
Công thức số hạng tổng quát của CSC: $u_n = u_1 + (n - 1)d$.
Với $n = 5$: $u_5 = 3 + 4 \\times 2 = 11$.

BẢNG ĐÁP ÁN:
1.A  2.A  3.B
`;

export default function CreateExamPage() {
  const router = useRouter();
  const [title, setTitle] = useState('Đề kiểm tra trắc nghiệm Toán 11');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [rawText, setRawText] = useState(SAMPLE_TEMPLATE);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Real-time parsing with memoization
  const parsedExam = useMemo(() => {
    return parseExamText(rawText, {
      title,
      durationMinutes: Number(durationMinutes) || 45,
    });
  }, [rawText, title, durationMinutes]);

  const handleSave = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề đề thi!');
      return;
    }
    if (parsedExam.questions.length === 0) {
      alert('Chưa nhận diện được câu hỏi nào. Vui lòng kiểm tra lại cấu trúc văn bản!');
      return;
    }

    setIsSaving(true);
    const examToSave = {
      ...parsedExam,
      id: `exam-${Date.now()}`,
      title,
      durationMinutes: Number(durationMinutes) || 45,
      createdAt: new Date().toISOString(),
    };

    saveExam(examToSave);
    setSuccessMessage(`Đã tạo thành công đề thi "${title}" với ${examToSave.totalQuestions} câu hỏi!`);

    setTimeout(() => {
      router.push('/teacher/exams');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white px-6 py-3.5 shadow-sm">
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
              <h1 className="text-base font-bold text-gray-900 leading-tight">Tạo đề thi mới (Tự động nhận diện)</h1>
              <p className="text-xs text-gray-500">Hỗ trợ nhận diện câu hỏi tiếng Việt, bảng đáp án và công thức Toán LaTeX</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRawText(SAMPLE_TEMPLATE)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Nạp đề mẫu</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu & Xuất bản đề'}</span>
            </button>
          </div>
        </div>
      </header>

      {successMessage && (
        <div className="mx-auto max-w-7xl px-6 pt-4">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Main Split Layout */}
      <main className="mx-auto max-w-7xl p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Text Input & Settings */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                <span>Thông tin đề thi</span>
              </h2>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tên đề thi:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Thời gian (phút):</label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">Nội dung đề thi (Văn bản hoặc Word copy):</label>
                  <span className="text-[11px] text-gray-400">Định dạng: Câu X: ..., A. B. C. D.</span>
                </div>
                <textarea
                  rows={20}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Dán nội dung đề thi vào đây..."
                  className="w-full font-mono text-xs leading-relaxed rounded-xl border border-gray-300 p-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Parsed Preview */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <FilePlus className="h-4 w-4 text-emerald-600" />
                    <span>Xem trước kết quả nhận diện (Live Preview)</span>
                  </h2>
                  <p className="text-xs text-gray-500">
                    Nhận diện được: <strong>{parsedExam.questions.length} câu hỏi</strong> ({parsedExam.questions.filter(q => q.correctAnswer).length} câu có đáp án)
                  </p>
                </div>
              </div>

              {parsedExam.questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 border border-dashed rounded-xl">
                  <AlertCircle className="h-10 w-10 mb-2 stroke-1 text-gray-400" />
                  <p className="text-sm font-medium">Chưa có câu hỏi nào được nhận diện</p>
                  <p className="text-xs mt-1">Dán nội dung câu hỏi bắt đầu bằng "Câu 1:", "Bài 1:" hoặc nhấn "Nạp đề mẫu".</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                  {parsedExam.questions.map(q => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      showAnswer={true}
                      readOnly={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
