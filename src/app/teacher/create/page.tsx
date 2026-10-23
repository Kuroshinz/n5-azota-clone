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

const SAMPLE_TEMPLATE = `ĐỀ THI MINH HỌA CHUẨN GDPT 2018
MÔN: TOÁN HỌC

PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (A, B, C, D)
Câu 1: Cho hàm số $f(x) = x^3 - 3x + 2$. Tìm đạo hàm $f'(x)$.
A. $f'(x) = 3x^2 - 3$
B. $f'(x) = 3x^2 + 3$
C. $f'(x) = x^2 - 3$
D. $f'(x) = 3x^2$
Đáp án: A
Hướng dẫn giải:
Ta có $(x^3 - 3x + 2)' = 3x^2 - 3$.

Câu 2: Vận tốc ánh sáng trong chân không xấp xỉ bằng bao nhiêu?
*A. $3 \\times 10^8\\text{ m/s}$
B. $3 \\times 10^5\\text{ m/s}$
C. $340\\text{ m/s}$
D. $1.5 \\times 10^8\\text{ m/s}$

PHẦN II. Câu trắc nghiệm đúng sai (4 ý a, b, c, d)
Câu 3: Cho hàm số $y = f(x) = x^3 - 3x^2 + 2$. Các khẳng định sau đúng hay sai?
a) Đồ thị hàm số đi qua điểm $A(0; 2)$.
b) Đạo hàm của hàm số là $f'(x) = 3x^2 - 6x$.
c) Hàm số đạt cực đại tại $x = 2$.
d) Giá trị cực tiểu của hàm số bằng $-2$.
Đáp án: a) Đ, b) Đ, c) S, d) Đ
Hướng dẫn giải:
a) $f(0) = 2$ nên đúng.
b) $f'(x) = 3x^2 - 6x$ nên đúng.
c) Cực đại tại $x = 0$, cực tiểu tại $x = 2$ nên c sai.
d) $f(2) = 8 - 12 + 2 = -2$ nên d đúng.

PHẦN III. Câu trắc nghiệm trả lời ngắn (Nhập đáp số)
Câu 4: Tìm số điểm cực trị của hàm số $g(x) = x^4 - 2x^2 + 3$.
Đáp số: 3
Hướng dẫn giải:
Phương trình $g'(x) = 4x(x^2 - 1) = 0$ có 3 nghiệm phân biệt.

Câu 5: Tính diện tích hình chữ nhật có chiều dài bằng 12.5 cm và chiều rộng bằng 4 cm.
Đáp án: 50
`;

export default function CreateExamPage() {
  const router = useRouter();
  const [title, setTitle] = useState('Đề thi minh họa chuẩn GDPT 2018');
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
              <p className="text-xs text-gray-500">Hỗ trợ nhận diện cả 3 dạng: Trắc nghiệm A/B/C/D, Đúng/Sai (a, b, c, d) và Trả lời ngắn</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRawText(SAMPLE_TEMPLATE)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Nạp đề mẫu chuẩn GDPT 2018</span>
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
                  <span className="text-[11px] text-gray-400">Tự động nhận diện Phần I, II, III</span>
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
                    Nhận diện được: <strong>{parsedExam.questions.length} câu hỏi</strong>
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
