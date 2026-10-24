'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { parseExamText } from '../../../parser/examParser';
import { extractTextAndImagesFromDocx } from '../../../parser/wordExtractor';
import { saveExam } from '../../../storage/examStorage';
import { QuestionCard } from '../../../components/QuestionCard';
import { ShareExamModal } from '../../../components/ShareExamModal';
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
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
                <Clock className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Input Mode Selector Tabs */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex rounded-xl bg-slate-200 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                inputMode === 'upload'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              <span>Tải file Word (.docx)</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                inputMode === 'text'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Dán văn bản trực tiếp</span>
            </button>
          </div>

          <div className="text-xs text-gray-500">
            Nhận diện: <strong className="text-indigo-600">{parsedExam.questions.length}</strong> câu hỏi
          </div>
        </div>

        {/* Word Upload Dropzone (When in upload mode) */}
        {inputMode === 'upload' && (
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mb-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                : 'border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleProcessDocxFile(e.target.files[0]);
                }
              }}
            />

            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
              {isExtracting ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <UploadCloud className="h-7 w-7" />
              )}
            </div>

            <h3 className="text-sm font-bold text-slate-800 mb-1">
              {isExtracting ? 'Đang trích xuất nội dung & hình ảnh...' : 'Kéo thả file Word (.docx) vào đây'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              Hệ thống tự động trích xuất các câu hỏi, bảng đáp án, công thức và nhúng các hình vẽ đồ thị base64 tức thì.
            </p>

            {extractedInfo && (
              <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Đã nhập: <strong>{extractedInfo.fileName}</strong> ({extractedInfo.fileSize})</span>
                {extractedInfo.imageCount > 0 && (
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full text-[11px]">
                    <ImageIcon className="h-3 w-3" />
                    {extractedInfo.imageCount} ảnh nhúng
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2-Column Split: Raw Text Input on Left, Live Parsed Preview on Right */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Column 1: Raw Text Input */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                <FileCode className="h-4 w-4 text-indigo-600" />
                Nội dung đề thi nguồn (Văn bản / Markdown)
              </span>
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_TEMPLATE)}
                className="text-[11px] font-semibold text-indigo-600 hover:underline"
              >
                Tải lại mẫu chuẩn
              </button>
            </div>

            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Nhập hoặc dán nội dung đề thi..."
              className="h-[620px] w-full resize-none rounded-xl border border-gray-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-gray-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              spellCheck={false}
            />

            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
              <span>Hỗ trợ thẻ công thức $ ... $ và hình ảnh ![Hình vẽ](data:image/...)</span>
              <span>{rawText.length} ký tự</span>
            </div>
          </div>

          {/* Column 2: Live Parsed Question Preview */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Xem trước câu hỏi nhận diện ({parsedExam.questions.length})
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                Xem trước thời gian thực
              </span>
            </div>

            <div className="h-[620px] overflow-y-auto space-y-4 pr-1">
              {parsedExam.questions.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                  <AlertCircle className="mb-2 h-8 w-8 text-amber-500" />
                  <p className="text-xs font-medium text-gray-600">
                    Chưa nhận diện được câu hỏi nào.
                  </p>
                  <p className="text-[11px] text-gray-400 max-w-xs mt-1">
                    Hãy đảm bảo các câu hỏi bắt đầu bằng <strong>Câu 1:</strong> hoặc <strong>Câu 1.</strong> và các đáp án bắt đầu bằng <strong>A.</strong>, <strong>B.</strong>...
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
