'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { parseExamText } from '../../../parser/examParser';
import { extractTextAndImagesFromDocx } from '../../../parser/wordExtractor';
import { saveExam } from '../../../storage/examStorage';
import { QuestionCard } from '../../../components/QuestionCard';
import { ShareExamModal } from '../../../components/ShareExamModal';
import { ExamSettingsModal } from '../../../components/ExamSettingsModal';
import { ExamSettings, DEFAULT_EXAM_SETTINGS } from '../../../types/exam';
import {
  FilePlus,
  Sparkles,
  Save,
  Clock,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText,
  FileCode,
  Image as ImageIcon,
  Loader2,
  Share2,
  Settings,
  ShieldCheck,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [title, setTitle] = useState('Đề thi minh họa chuẩn GDPT 2018');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [rawText, setRawText] = useState(SAMPLE_TEMPLATE);

  // Exam Settings state
  const [settings, setSettings] = useState<ExamSettings>(DEFAULT_EXAM_SETTINGS);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // File extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<{
    fileName: string;
    fileSize: string;
    imageCount: number;
  } | null>(null);

  // Share Modal state
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Real-time parsing with memoization
  const parsedExam = useMemo(() => {
    return parseExamText(rawText, {
      title,
      durationMinutes: Number(durationMinutes) || 45,
    });
  }, [rawText, title, durationMinutes]);

  const handleProcessDocxFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      alert('Vui lòng chọn file định dạng Microsoft Word (.docx)!');
      return;
    }

    try {
      setIsExtracting(true);
      const buffer = await file.arrayBuffer();
      const result = await extractTextAndImagesFromDocx(buffer);

      setRawText(result.rawText);
      setExtractedInfo({
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        imageCount: result.imageCount,
      });

      // Auto-update title if file name is suitable
      const cleanName = file.name.replace(/\.docx$/i, '');
      if (cleanName && title === 'Đề thi minh họa chuẩn GDPT 2018') {
        setTitle(cleanName);
      }
    } catch (err: any) {
      console.error('Lỗi trích xuất file docx:', err);
      alert('Không thể trích xuất file Word. Vui lòng kiểm tra lại file của bạn!');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleProcessDocxFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề đề thi!');
      return;
    }
    if (parsedExam.questions.length === 0) {
      alert('Chưa nhận diện được câu hỏi nào. Vui lòng kiểm tra lại cấu trúc văn bản hoặc file Word!');
      return;
    }

    const newId = `exam-${Date.now()}`;
    const examToSave = {
      ...parsedExam,
      id: newId,
      title,
      durationMinutes: Number(durationMinutes) || 45,
      settings,
      createdAt: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam: examToSave }),
      });
    } catch (e) {
      console.warn('API save error, persisting to local cache', e);
    } finally {
      saveExam(examToSave);
      setCreatedExamId(newId);
      setIsShareModalOpen(true);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur shadow-sm">
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
                Tạo đề thi mới & Nhận diện tự động
              </h1>
              <p className="text-xs text-gray-500">
                Hỗ trợ trích xuất từ file Word (.docx), công thức KaTeX và nhận diện 3 dạng câu hỏi GDPT 2018
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Exam Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 transition"
            >
              <Settings className="h-4 w-4 text-indigo-600" />
              <span>Cấu hình đề</span>
              {settings.enableProctoring ? (
                <span className="flex items-center gap-1 rounded-md bg-indigo-100 px-1.5 py-0.5 text-[11px] font-bold text-indigo-700">
                  <ShieldCheck className="h-3 w-3" />
                  Giám sát
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  <BookOpen className="h-3 w-3" />
                  Ôn tập
                </span>
              )}
            </button>

            {/* Save & Publish Button */}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isSaving ? 'Đang lưu...' : 'Lưu & Xuất bản'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-6 pt-6">
        {/* Exam Metadata bar */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tên đề thi:
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ví dụ: Đề kiểm tra giữa học kỳ 1 môn Toán 12"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Thời gian làm bài (phút):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400">phút</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Column 1: Source Input (Upload Word or Raw Text) */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-slate-50 px-4 pt-3">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                  inputMode === 'upload'
                    ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <UploadCloud className="h-4 w-4" />
                <span>Nhập từ file Word (.docx)</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                  inputMode === 'text'
                    ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileCode className="h-4 w-4" />
                <span>Nhập Text / Markdown trực tiếp</span>
              </button>
            </div>

            {/* Tab 1: Upload Word */}
            {inputMode === 'upload' && (
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                      : 'border-gray-300 bg-slate-50 hover:border-indigo-400 hover:bg-slate-100/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessDocxFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                    {isExtracting ? (
                      <Loader2 className="h-7 w-7 animate-spin" />
                    ) : (
                      <UploadCloud className="h-7 w-7" />
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">
                    Kéo & thả file đề Word (.docx) vào đây
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 max-w-sm">
                    Tự động nhận diện công thức toán LaTeX, hình ảnh minh họa nhúng trong đề, bảng biểu và đáp án
                  </p>

                  <button
                    type="button"
                    disabled={isExtracting}
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                  >
                    {isExtracting ? 'Đang trích xuất nội dung...' : 'Chọn file từ máy tính'}
                  </button>
                </div>

                {extractedInfo && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-950">{extractedInfo.fileName}</p>
                        <p className="text-[11px] text-emerald-700">
                          Kích thước: {extractedInfo.fileSize} • Trích xuất thành công{' '}
                          <span className="font-semibold">{extractedInfo.imageCount} hình ảnh</span>
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" /> Đã nhập
                    </span>
                  </div>
                )}

                <div className="mt-5 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Đã nhận diện: {parsedExam.questions.length} câu hỏi</span>
                    <button
                      type="button"
                      onClick={() => setInputMode('text')}
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      Xem hoặc sửa nội dung trích xuất →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Text Editor */}
            {inputMode === 'text' && (
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">
                    Nội dung văn bản thô (Hỗ trợ cú pháp Azota & LaTeX $...$):
                  </span>
                  <button
                    type="button"
                    onClick={() => setRawText(SAMPLE_TEMPLATE)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Nạp đề mẫu GDPT 2018
                  </button>
                </div>
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  rows={20}
                  className="flex-1 w-full font-mono text-xs text-gray-800 rounded-xl border border-gray-300 p-3.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* Column 2: Live Question Preview */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Xem trước đề thi ({parsedExam.questions.length} câu đã nhận diện)
                </h2>
              </div>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                Tổng điểm: {parsedExam.questions.reduce((sum, q) => sum + (q.score || 0), 0).toFixed(2)}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[720px]">
              {parsedExam.questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
                  <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm font-medium">Chưa có câu hỏi nào được nhận diện</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tải lên file Word hoặc dán nội dung văn bản theo định dạng &quot;Câu 1:&quot;, &quot;A.&quot;, &quot;B.&quot;
                  </p>
                </div>
              ) : (
                parsedExam.questions.map(q => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    showAnswer={true}
                    readOnly={true}
                    selectedOption={
                      (q.type === 'true_false' && q.subItems
                        ? (Object.fromEntries(q.subItems.map(s => [s.key, s.correctAnswer ?? true])) as any)
                        : q.correctAnswer || (q.acceptedAnswers ? q.acceptedAnswers[0] : undefined)) as any
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Exam Settings Modal */}
      <ExamSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />

      {/* Share Exam Modal with QR Code and Direct Copy */}
      <ShareExamModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        examId={createdExamId || ''}
        examTitle={title}
        durationMinutes={Number(durationMinutes) || 45}
        totalQuestions={parsedExam.questions.length}
      />
    </div>
  );
}
