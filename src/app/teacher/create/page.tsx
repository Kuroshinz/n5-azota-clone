'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { parseExamText } from '../../../parser/examParser';
import { extractTextAndImagesFromDocx } from '../../../parser/wordExtractor';
import { cleanPdfExamText, normalizePdfInlineChoices, extractTextFromPdf } from '../../../parser/pdfExtractor';
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
  Wand2,
  Trash2,
  PlusCircle,
  Sigma,
  FileCheck,
  RefreshCw,
  HelpCircle,
  ListOrdered,
  Eye,
  Columns,
  Table,
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
  const [extractProgressMessage, setExtractProgressMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<{
    fileName: string;
    fileSize: string;
    fileType: 'pdf' | 'docx' | 'txt' | 'md';
    imageCount?: number;
    pageCount?: number;
    detectedQuestions?: number;
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

  // Breakdown of parsed question types
  const questionTypeStats = useMemo(() => {
    let mc = 0;
    let tf = 0;
    let sa = 0;
    for (const q of parsedExam.questions) {
      if (q.type === 'multiple_choice') mc++;
      else if (q.type === 'true_false') tf++;
      else if (q.type === 'short_answer') sa++;
    }
    return { mc, tf, sa, total: parsedExam.questions.length };
  }, [parsedExam.questions]);

  // Unified File Processor (Handles PDF, Word DOCX, and TXT)
  const handleProcessFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'txt' && ext !== 'md') {
      alert('Vui lòng chọn file định dạng PDF (.pdf), Word (.docx), Văn bản (.txt) hoặc Markdown (.md)!');
      return;
    }

    try {
      setIsExtracting(true);

      const baseTitle = file.name.replace(/\.[^/.]+$/, '').trim();
      if (baseTitle && title === 'Đề thi minh họa chuẩn GDPT 2018') {
        setTitle(baseTitle);
      }

      // CASE 1: PDF Document (Direct in-browser extraction using Web Workers & ArrayBuffer)
      if (ext === 'pdf') {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setExtractProgressMessage(`Đang đọc file PDF (${sizeMb} MB) vào bộ nhớ...`);
        let extractedSuccessfully = false;
        let clientErrorMsg = '';

        // Try direct in-browser extraction first (Supports files of ANY size like 13MB, 50MB with zero network upload limit)
        try {
          const buffer = await file.arrayBuffer();
          const result = await extractTextFromPdf(buffer, (step) => {
            setExtractProgressMessage(step);
          });

          if (result.rawText && result.rawText.trim().length > 0) {
            setRawText(result.rawText);
            setExtractedInfo({
              fileName: file.name,
              fileSize: `${sizeMb} MB`,
              fileType: 'pdf',
              pageCount: result.pageCount,
              detectedQuestions: result.questionCount,
            });
            extractedSuccessfully = true;
          } else {
            throw new Error('File PDF không chứa lớp văn bản có thể nhận diện (có thể là file scan hình ảnh).');
          }
        } catch (clientErr: any) {
          console.warn('In-browser PDF parsing encountered an error, attempting server fallback if eligible...', clientErr);
          clientErrorMsg = clientErr?.message || 'Lỗi bóc tách PDF trên trình duyệt';
        }

        // If client-side couldn't extract or failed, attempt server route if file size is permitted
        if (!extractedSuccessfully) {
          if (file.size > 4.2 * 1024 * 1024) {
            throw new Error(
              `Không thể trích xuất văn bản từ file PDF (${sizeMb} MB): ${clientErrorMsg}. ` +
              `Vui lòng kiểm tra lại xem file PDF có thể bôi đen chữ được không, hoặc chuyển sang định dạng Word (.docx).`
            );
          }

          setExtractProgressMessage('Đang kết nối máy chủ phân tích tài liệu...');
          const formData = new FormData();
          formData.append('file', file);

          const res = await fetch('/api/parser/pdf', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const rawResponse = await res.text();
            if (res.status === 413 || rawResponse.includes('Request Entity')) {
              throw new Error('Dung lượng file PDF vượt quá giới hạn tải lên của máy chủ (tối đa 4.5MB). Vui lòng nén nhỏ file hoặc dùng file Word.');
            }
            throw new Error(`Máy chủ thông báo lỗi (${res.status}): ${rawResponse.slice(0, 120)}`);
          }

          const data = await res.json();
          if (!data.success) {
            throw new Error(data.error || 'Không thể trích xuất file PDF');
          }

          setRawText(data.text);
          setExtractedInfo({
            fileName: file.name,
            fileSize: data.fileSize || `${(file.size / 1024).toFixed(1)} KB`,
            fileType: 'pdf',
            pageCount: data.pageCount,
            detectedQuestions: data.questionCount,
          });
        }
      }
      // CASE 2: Word DOCX Document (Dual-layer: In-browser + Server fallback)
      else if (ext === 'docx') {
        setExtractProgressMessage('Đang giải nén văn bản, bảng số liệu và hình ảnh từ file Word...');
        let docxExtracted = false;
        let clientDocxError = '';

        try {
          const buffer = await file.arrayBuffer();
          const result = await extractTextAndImagesFromDocx(buffer);

          if (result && result.rawText && result.rawText.trim().length > 0) {
            setRawText(result.rawText);
            setExtractedInfo({
              fileName: file.name,
              fileSize: `${(file.size / 1024).toFixed(1)} KB`,
              fileType: 'docx',
              imageCount: result.imageCount,
            });
            docxExtracted = true;
          }
        } catch (clientErr: any) {
          console.warn('In-browser DOCX parsing encountered an issue, falling back to server route...', clientErr);
          clientDocxError = clientErr?.message || 'Lỗi bóc tách Word trên trình duyệt';
        }

        // Automatic fallback to server-side parser route
        if (!docxExtracted) {
          setExtractProgressMessage('Đang kết nối máy chủ phân tích tài liệu Word...');
          const formData = new FormData();
          formData.append('file', file);

          const res = await fetch('/api/parser/docx', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const rawResponse = await res.text();
            throw new Error(`Không thể giải nén file Word (.docx): ${clientDocxError || rawResponse.slice(0, 120)}`);
          }

          const data = await res.json();
          if (!data.success) {
            throw new Error(data.error || 'Không thể trích xuất file Word');
          }

          setRawText(data.text);
          setExtractedInfo({
            fileName: file.name,
            fileSize: data.fileSize || `${(file.size / 1024).toFixed(1)} KB`,
            fileType: 'docx',
            imageCount: data.imageCount,
          });
        }
      }
      // CASE 3: Plain Text File
      else if (ext === 'txt') {
        setExtractProgressMessage('Đang đọc văn bản...');
        const textContent = await file.text();
        const cleaned = cleanPdfExamText(textContent);
        setRawText(cleaned);
        setExtractedInfo({
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          fileType: 'txt',
        });
      }
      // CASE 4: Markdown File (.md)
      else if (ext === 'md') {
        setExtractProgressMessage('Đang nạp và phân tích file Markdown (.md)...');
        const textContent = await file.text();
        const cleaned = cleanPdfExamText(textContent);
        setRawText(cleaned);
        setExtractedInfo({
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          fileType: 'md',
        });
      }

      // Automatically switch to editable text mode for immediate inspection & refinement
      setInputMode('text');
    } catch (err: any) {
      console.error('Lỗi khi xử lý file:', err);
      alert('Lỗi xử lý file: ' + (err.message || 'Không thể đọc nội dung file'));
    } finally {
      setIsExtracting(false);
      setExtractProgressMessage('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Quick Text Editing Utilities
  const handleNormalizeChoices = () => {
    const updated = normalizePdfInlineChoices(rawText);
    setRawText(updated);
  };

  const handleCleanHeaderFooters = () => {
    const updated = cleanPdfExamText(rawText);
    setRawText(updated);
  };

  const handleInsertTemplate = (type: 'mc' | 'tf' | 'sa' | 'math' | 'table' | 'data-table') => {
    const nextNum = parsedExam.questions.length + 1;
    let snippet = '';

    if (type === 'mc') {
      snippet = `\n\nCâu ${nextNum}: Nhập nội dung câu hỏi trắc nghiệm tại đây.\nA. Phương án A\nB. Phương án B\nC. Phương án C\nD. Phương án D\nĐáp án: A\nHướng dẫn giải:\nGiải thích chi tiết cho câu hỏi tại đây.`;
    } else if (type === 'tf') {
      snippet = `\n\nCâu ${nextNum}: Cho giả thiết bài toán... Các khẳng định sau đúng hay sai?\na) Khẳng định 1\nb) Khẳng định 2\nc) Khẳng định 3\nd) Khẳng định 4\nĐáp án: a) Đ, b) S, c) Đ, d) S\nHướng dẫn giải:\nGiải thích chi tiết.`;
    } else if (type === 'sa') {
      snippet = `\n\nCâu ${nextNum}: Nhập câu hỏi yêu cầu tính ra đáp số cụ thể.\nĐáp số: 10\nHướng dẫn giải:\nTrình bày các bước tính toán tại đây.`;
    } else if (type === 'math') {
      snippet = ` $f(x) = \\int_0^1 \\sqrt{x^2 + 1} dx$ `;
    } else if (type === 'table') {
      snippet = `\n\nBẢNG ĐÁP ÁN:\n1. A   2. B   3. C   4. D   5. A\n6. B   7. C   8. D   9. A   10. B\n`;
    } else if (type === 'data-table') {
      snippet = `\n\n| Nhiệt độ (°C) | [H2] (mol/L) | [I2] (mol/L) | [HI] (mol/L) | Kc |\n| :--- | :--- | :--- | :--- | :--- |\n| 25 | 0,0355 | 0,0388 | 0,9220 | 50 |\n| 340 | 0,0380 | 0,0455 | 0,3870 | 9,6 |\n| 445 | 0,0485 | 0,0468 | 0,3540 | 50 |\n`;
    }

    setRawText(prev => prev + snippet);
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
      <div className="border-b border-gray-200 bg-white/95 px-3 sm:px-6 py-3 sm:py-4 shadow-sm">
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
              <h1 className="text-lg font-bold text-gray-900 leading-tight flex items-center gap-2">
                <span>Tạo đề thi thông minh</span>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                  Chuẩn GDPT 2018
                </span>
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Hỗ trợ tải lên file <strong>PDF</strong>, <strong>Word (.docx)</strong>, <strong>Markdown (.md)</strong> hoặc văn bản để tự động bóc tách & chỉnh sửa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Exam Settings Modal Button */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-indigo-300 transition cursor-pointer"
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

      <main className="mx-auto max-w-7xl px-3 sm:px-6 pt-4 sm:pt-6">
        {/* Exam Metadata bar */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
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

        {/* Two-Column Editor Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Column 1: Source Input (PDF / Word / Text) */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Tabs & Extraction Info */}
            <div className="flex flex-wrap items-center justify-between border-b border-gray-200 bg-slate-50/80 px-4 py-2.5 gap-2">
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
                  <span>Kéo thả file (PDF / Word)</span>
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
                  <span>Soạn thảo & Chỉnh sửa</span>
                </button>
              </div>

              {extractedInfo && (
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    extractedInfo.fileType === 'pdf'
                      ? 'bg-rose-100 text-rose-700'
                      : extractedInfo.fileType === 'docx'
                      ? 'bg-blue-100 text-blue-700'
                      : extractedInfo.fileType === 'md'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {extractedInfo.fileType}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span className="truncate max-w-[150px]" title={extractedInfo.fileName}>
                      {extractedInfo.fileName}
                    </span>
                    {extractedInfo.pageCount && <span>({extractedInfo.pageCount} trang)</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                    title="Đổi file khác"
                  >
                    Đổi file
                  </button>
                </div>
              )}
            </div>

            {/* Input Body */}
            <div className="flex-1 p-4 flex flex-col">
              {inputMode === 'upload' ? (
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex h-[520px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/60 shadow-inner'
                      : 'border-gray-300 bg-slate-50/50 hover:border-indigo-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleProcessFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {isExtracting ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">Đang phân tích cấu trúc tài liệu...</h4>
                      <p className="text-xs text-indigo-600 font-medium max-w-sm animate-pulse">
                        {extractProgressMessage || 'Hệ thống đang trích xuất văn bản, bảng đáp án và công thức toán học...'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
                        <UploadCloud className="h-8 w-8" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">
                        Kéo thả file Đề thi vào đây
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 max-w-sm leading-relaxed">
                        Hỗ trợ định dạng <strong>PDF (.pdf)</strong>, <strong>Word (.docx)</strong>, <strong>Markdown (.md)</strong> hoặc <strong>Text (.txt)</strong>.
                        Tự động nhận diện câu hỏi trắc nghiệm, đúng/sai, trả lời ngắn và công thức KaTeX.
                      </p>

                      <div className="flex items-center gap-2 my-4">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-700">
                          <FileText className="h-3.5 w-3.5" />
                          Adobe PDF (.pdf)
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700">
                          <FileText className="h-3.5 w-3.5" />
                          Word (.docx)
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-700">
                          <FileCode className="h-3.5 w-3.5" />
                          Markdown (.md)
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
                          <FileCode className="h-3.5 w-3.5" />
                          Văn bản (.txt)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition cursor-pointer"
                      >
                        Chọn file từ máy tính
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  {/* Smart Text Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200 p-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] font-bold text-gray-500 uppercase mr-1">Xử lý nhanh:</span>
                      <button
                        type="button"
                        onClick={handleNormalizeChoices}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 font-semibold text-gray-700 hover:bg-gray-100 hover:border-indigo-300 transition cursor-pointer"
                        title="Tách các đáp án A, B, C, D nằm cùng hàng thành từng dòng riêng biệt"
                      >
                        <Wand2 className="h-3 w-3 text-indigo-600" />
                        <span>Chuẩn hóa A/B/C/D</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCleanHeaderFooters}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 font-semibold text-gray-700 hover:bg-gray-100 hover:border-indigo-300 transition cursor-pointer"
                        title="Xóa bỏ các số trang 'Trang 1/5' hoặc tiêu đề lặp lại"
                      >
                        <Trash2 className="h-3 w-3 text-rose-600" />
                        <span>Lọc bỏ số trang/rác</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('mc')}
                        className="rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                        title="Chèn mẫu trắc nghiệm 4 lựa chọn"
                      >
                        + Trắc nghiệm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('tf')}
                        className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                        title="Chèn mẫu đúng / sai 4 ý"
                      >
                        + Đúng/Sai
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('sa')}
                        className="rounded-lg bg-purple-50 border border-purple-200 px-2 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition cursor-pointer"
                        title="Chèn mẫu trả lời ngắn"
                      >
                        + Điền đáp số
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('data-table')}
                        className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer"
                        title="Chèn bảng số liệu (vật lý, hóa học, toán học)"
                      >
                        <Table className="h-3 w-3" />
                        <span>Bảng số liệu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('table')}
                        className="rounded-lg bg-cyan-50 border border-cyan-200 px-2 py-1 text-[11px] font-bold text-cyan-700 hover:bg-cyan-100 transition cursor-pointer"
                        title="Chèn bảng đáp án cuối đề để hệ thống tự khớp"
                      >
                        📋 Bảng đáp án
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('math')}
                        className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition flex items-center gap-0.5 cursor-pointer"
                        title="Chèn mẫu công thức Toán KaTeX"
                      >
                        <Sigma className="h-3 w-3" />
                        <span>Công thức</span>
                      </button>
                    </div>
                  </div>

                  {/* Textarea for Direct Live Editing */}
                  <textarea
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    placeholder="Dán hoặc chỉnh sửa nội dung đề thi tại đây..."
                    className="h-[460px] w-full resize-none rounded-xl border border-gray-200 p-3.5 font-mono text-xs leading-relaxed text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Live Real-time Visual Preview */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Live Stats Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-gray-200 bg-slate-50/80 px-4 py-3 gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Xem trước trực quan ({questionTypeStats.total} câu)
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                  Phần I: {questionTypeStats.mc}
                </span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  Phần II: {questionTypeStats.tf}
                </span>
                <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[11px] font-bold text-purple-700">
                  Phần III: {questionTypeStats.sa}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-700">
                  10.00 đ
                </span>
              </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 max-h-[580px] overflow-y-auto p-4 space-y-4">
              {parsedExam.questions.length === 0 ? (
                <div className="flex h-96 flex-col items-center justify-center text-center text-gray-400">
                  <BookOpen className="mb-2 h-10 w-10 opacity-30" />
                  <p className="text-xs font-semibold text-gray-600">Chưa có câu hỏi nào được bóc tách</p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                    Kéo thả file <strong>PDF</strong>, <strong>Word</strong> hoặc nhập theo mẫu chuẩn GDPT (Câu 1, Câu 2...) để hệ thống tự động nhận diện.
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
