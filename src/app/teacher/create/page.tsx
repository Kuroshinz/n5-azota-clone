'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { parseExamText } from '../../../parser/examParser';
import { extractTextAndImagesFromDocx } from '../../../parser/wordExtractor';
import { saveExam } from '../../../storage/examStorage';
import { QuestionCard } from '../../../components/QuestionCard';
import { ShareExamModal } from '../../../components/ShareExamModal';
import { ExamSettingsModal } from '../../../components/ExamSettingsModal';
import { Navbar } from '../../../components/Navbar';
import { useAuth } from '@/context/AuthContext';
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
  Edit3,
  Globe,
  Lock,
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
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [title, setTitle] = useState('Đề thi minh họa chuẩn GDPT 2018');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [rawText, setRawText] = useState(SAMPLE_TEMPLATE);
  const [isPublic, setIsPublic] = useState(true);

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

      const cleanTitle = file.name.replace(/\.docx$/i, '').trim();
      if (cleanTitle) {
        setTitle(cleanTitle);
      }

      setExtractedInfo({
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        imageCount: result.imageCount,
      });

      setInputMode('text');
    } catch (err: any) {
      console.error('Error reading docx:', err);
      alert('Không thể đọc file Word: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessDocxFile(e.dataTransfer.files[0]);
    }
  };

  const handleSaveExam = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên đề thi!');
      return;
    }

    if (!parsedExam.questions || parsedExam.questions.length === 0) {
      alert('Không tìm thấy câu hỏi hợp lệ trong đề thi. Vui lòng kiểm tra lại cấu trúc đề!');
      return;
    }

    const newId = `exam-${Date.now()}`;
    const examToSave = {
      ...parsedExam,
      id: newId,
      title,
      durationMinutes: Number(durationMinutes) || 45,
      settings,
      authorId: user?.id || null,
      isPublic,
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
      {/* Universal Top Navigation */}
      <Navbar />

      {/* Main Sub-Header */}
      <div className="border-b border-gray-200 bg-white/95 px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/teacher/exams"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 transition"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                Tạo đề thi mới (Tự động bóc tách GDPT 2018)
              </h1>
              <p className="text-xs text-gray-500">
                Nhận diện tự động Trắc nghiệm A/B/C/D, Đúng/Sai 4 ý, Điền đáp số & Công thức Toán KaTeX
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Exam Settings Modal Button */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-indigo-300 transition"
            >
              <Settings className="h-4 w-4 text-indigo-600" />
              <span>Cấu hình đề thi</span>
              {settings.enableProctoring && (
                <span className="flex h-2 w-2 rounded-full bg-purple-600" />
              )}
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveExam}
              disabled={isSaving || parsedExam.questions.length === 0}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Hoàn tất & Xuất bản</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 pt-6">
        {/* Exam Metadata bar */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 items-center">
            <div className="sm:col-span-6">
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

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Thời gian làm bài:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 pl-3.5 pr-12 py-2 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400">phút</span>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Chế độ chia sẻ đề thi:
              </label>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                  isPublic
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isPublic ? <Globe className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4 text-amber-600" />}
                  <span>{isPublic ? 'Công khai (Public)' : 'Riêng tư'}</span>
                </div>
                <span className="text-[10px] font-bold opacity-75">
                  {isPublic ? 'Ai có link cũng thi được' : 'Chỉ mình tôi'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Column 1: Source Input (Upload Word or Raw Text) */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-slate-50/70 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    inputMode === 'upload'
                      ? 'bg-white text-indigo-700 shadow-xs border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Tải file Word (.docx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    inputMode === 'text'
                      ? 'bg-white text-indigo-700 shadow-xs border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>Chỉnh sửa văn bản thô</span>
                </button>
              </div>

              {extractedInfo && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {extractedInfo.fileName} ({extractedInfo.imageCount} ảnh)
                </span>
              )}
            </div>

            {/* Input Body */}
            <div className="flex-1 p-4">
              {inputMode === 'upload' ? (
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex h-96 flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-gray-300 bg-slate-50/50 hover:border-gray-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleProcessDocxFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {isExtracting ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                      <p className="text-xs font-semibold text-gray-700">
                        Đang đọc văn bản, bóc tách cấu trúc câu hỏi & hình ảnh từ file Word...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs">
                        <UploadCloud className="h-7 w-7" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-800">
                        Kéo thả file Word (.docx) đề thi vào đây
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 max-w-xs">
                        Hệ thống tự động nhận diện chữ, bảng biểu, công thức Toán học KaTeX và trích xuất ảnh minh họa.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
                      >
                        Chọn file từ máy tính
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <textarea
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    placeholder="Dán nội dung đề thi vào đây..."
                    className="h-96 w-full resize-none font-mono text-xs leading-relaxed text-gray-800 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Live Parsed Preview */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 bg-slate-50/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Xem trước trực quan ({parsedExam.questions.length} câu)
                </h2>
              </div>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                Thang 10 điểm
              </span>
            </div>

            <div className="flex-1 max-h-[720px] overflow-y-auto p-4 space-y-4">
              {parsedExam.questions.length === 0 ? (
                <div className="flex h-96 flex-col items-center justify-center text-center text-gray-400">
                  <BookOpen className="mb-2 h-10 w-10 opacity-30" />
                  <p className="text-xs font-semibold">Chưa có câu hỏi nào được bóc tách</p>
                  <p className="text-[11px] mt-1 max-w-xs">
                    Vui lòng tải file Word hoặc nhập nội dung theo mẫu chuẩn câu hỏi (Câu 1, Câu 2...)
                  </p>
                </div>
              ) : (
                parsedExam.questions.map((q, idx) => (
                  <QuestionCard
                    key={q.id || idx}
                    displayNumber={idx + 1}
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

      {/* Share Modal */}
      {createdExamId && (
        <ShareExamModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            router.push('/teacher/exams');
          }}
          examId={createdExamId}
          examTitle={title}
          durationMinutes={Number(durationMinutes) || 45}
          totalQuestions={parsedExam.questions.length}
        />
      )}

      {/* Settings Modal */}
      <ExamSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={(updated: ExamSettings) => setSettings(updated)}
      />
    </div>
  );
}
