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

  const handleSave = () => {
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

    saveExam(examToSave);
    setCreatedExamId(newId);
    setIsShareModalOpen(true);
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
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
            >
              <Save className="h-4 w-4" />
              <span>Lưu & Xuất bản</span>
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
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-3 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ingestion Mode Tabs */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-xl bg-slate-200/80 p-1">
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
                ? 'border-indigo-600 bg-indigo-50/70'
                : 'border-indigo-200 bg-white hover:border-indigo-400 hover:bg-slate-50/50'
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

            {isExtracting ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <div className="text-sm font-bold text-gray-900">Đang đọc và trích xuất file Word...</div>
                <p className="text-xs text-gray-500">Bóc tách công thức toán, hình vẽ nhúng và cấu trúc đề thi</p>
              </div>
            ) : extractedInfo ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-1">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="text-sm font-bold text-emerald-900">
                  {extractedInfo.fileName} ({extractedInfo.fileSize})
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Trích xuất thành công <strong>{extractedInfo.imageCount}</strong> hình vẽ nhúng</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Nhấp hoặc kéo thả file khác để thay thế
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-1">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="text-sm font-bold text-gray-900">
                  Kéo thả file Word (.docx) vào đây, hoặc <span className="text-indigo-600 underline">chọn từ máy tính</span>
                </div>
                <p className="text-xs text-gray-500">
                  Hệ thống tự động nhận diện câu hỏi, đáp án A/B/C/D, Đúng/Sai, Trả lời ngắn và hình vẽ
                </p>
              </div>
            )}
          </div>
        )}

        {/* Live Split-View Workspace */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Text / Script Editor */}
          <div className="lg:col-span-5 flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm h-[720px]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-indigo-600" />
                <span>Nội dung văn bản đề thi (Có thể chỉnh sửa)</span>
              </span>
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_TEMPLATE)}
                className="text-[11px] font-semibold text-indigo-600 hover:underline"
              >
                Nạp lại đề mẫu
              </button>
            </div>

            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Dán nội dung đề thi vào đây..."
              className="flex-1 w-full rounded-xl border border-gray-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-gray-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none overflow-y-auto"
            />
          </div>

          {/* Right Column: Live Real-time Rendered Questions */}
          <div className="lg:col-span-7 flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm h-[720px]">
            <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-bold text-gray-800">
                  Xem trước trực quan ({parsedExam.questions.length} câu hỏi)
                </span>
              </div>
              <span className="text-[11px] text-gray-500">
                Tự động render KaTeX & Hình ảnh
              </span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              {parsedExam.questions.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-8 text-gray-400">
                  <BookOpen className="h-10 w-10 mb-2 stroke-1" />
                  <p className="text-sm font-semibold">Chưa có câu hỏi nào được nhận diện</p>
                  <p className="text-xs mt-1">
                    Hãy dán đề thi hoặc tải file Word ở cột bên trái theo định dạng: "Câu 1: ... A. ... B. ... C. ... D. ... Đáp án: A"
                  </p>
                </div>
              ) : (
                parsedExam.questions.map(q => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    showAnswer={true}
                    readOnly={true}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Post-publish Share Exam Modal */}
      {createdExamId && (
        <ShareExamModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          examId={createdExamId}
          examTitle={title}
          durationMinutes={durationMinutes}
          totalQuestions={parsedExam.questions.length}
        />
      )}
    </div>
  );
}
