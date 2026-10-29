'use client';

import React, { useState, useRef } from 'react';
import { Question, OptionKey } from '../types/exam';
import { parseExamText, distributeExamScores, normalizeExamQuestions } from '../parser/examParser';
import { extractTextAndImagesFromDocx } from '../parser/wordExtractor';
import { extractTextFromPdf } from '../parser/pdfExtractor';
import {
  X,
  UploadCloud,
  FileText,
  FileCode,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQuestions: (questions: Question[], mode: 'replace' | 'append') => void;
  currentCount: number;
}

export function ImportQuestionsModal({
  isOpen,
  onClose,
  onApplyQuestions,
  currentCount,
}: ImportQuestionsModalProps) {
  const [tab, setTab] = useState<'upload' | 'text'>('upload');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractMessage, setExtractMessage] = useState('');
  const [rawText, setRawText] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [autoDistribute, setAutoDistribute] = useState(true);
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; type: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['docx', 'pdf', 'txt', 'md'].includes(ext || '')) {
      setErrorMessage('Vui lòng chọn file định dạng Word (.docx), PDF (.pdf), Text (.txt) hoặc Markdown (.md)');
      return;
    }

    setErrorMessage(null);
    setIsExtracting(true);
    setFileInfo({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: ext?.toUpperCase() || 'FILE',
    });

    try {
      if (ext === 'docx') {
        setExtractMessage('Đang trích xuất nội dung từ file Word...');
        const buffer = await file.arrayBuffer();
        const res = await extractTextAndImagesFromDocx(buffer);
        if (res && res.rawText && res.rawText.trim()) {
          setRawText(res.rawText);
          const exam = parseExamText(res.rawText);
          setParsedQuestions(exam.questions);
        } else {
          throw new Error('Không tìm thấy nội dung văn bản trong file Word này.');
        }
      } else if (ext === 'pdf') {
        setExtractMessage('Đang đọc cấu trúc file PDF...');
        const buffer = await file.arrayBuffer();
        const res = await extractTextFromPdf(buffer, (step) => setExtractMessage(step));
        if (res && res.rawText && res.rawText.trim()) {
          setRawText(res.rawText);
          const exam = parseExamText(res.rawText);
          setParsedQuestions(exam.questions);
        } else {
          throw new Error('Không thể trích xuất văn bản từ PDF (có thể là file scan dạng ảnh).');
        }
      } else {
        setExtractMessage('Đang đọc tệp văn bản...');
        const text = await file.text();
        setRawText(text);
        const exam = parseExamText(text);
        setParsedQuestions(exam.questions);
      }
    } catch (err: any) {
      console.error('File import error:', err);
      setErrorMessage(err.message || 'Lỗi khi trích xuất file');
      setParsedQuestions([]);
    } finally {
      setIsExtracting(false);
      setExtractMessage('');
    }
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParsedQuestions([]);
      return;
    }
    const exam = parseExamText(text);
    setParsedQuestions(exam.questions);
  };

  const handleApply = () => {
    if (parsedQuestions.length === 0) return;

    let finalQuestions = normalizeExamQuestions(parsedQuestions);

    if (autoDistribute) {
      const targetCount = importMode === 'replace' ? finalQuestions.length : currentCount + finalQuestions.length;
      const scores = distributeExamScores(targetCount, 10);
      if (importMode === 'replace') {
        finalQuestions = finalQuestions.map((q, idx) => ({ ...q, score: scores[idx] ?? 0.25 }));
      } else {
        const offset = currentCount;
        finalQuestions = finalQuestions.map((q, idx) => ({ ...q, score: scores[offset + idx] ?? 0.25 }));
      }
    }

    onApplyQuestions(finalQuestions, importMode);
    onClose();
  };

  const mcCount = parsedQuestions.filter((q) => q.type === 'multiple_choice').length;
  const tfCount = parsedQuestions.filter((q) => q.type === 'true_false').length;
  const saCount = parsedQuestions.filter((q) => q.type === 'short_answer').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Nạp lại câu hỏi từ File đề</h2>
              <p className="text-xs text-gray-500">Hỗ trợ định dạng Word (.docx), PDF (.pdf), TXT và văn bản mẫu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-100 px-6 pt-2 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              tab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Tải tệp tin lên</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('text')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              tab === 'text'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Dán nội dung trực tiếp</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {tab === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessFile(file);
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/20"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-xs group-hover:scale-105 transition">
                  <UploadCloud className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">
                  Nhấp để tải lên hoặc kéo thả tệp vào đây
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  Hỗ trợ Word (.docx), PDF (.pdf), Văn bản (.txt, .md)
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs group-hover:bg-indigo-700 transition">
                  Chọn file từ máy tính
                </span>
              </div>

              {isExtracting && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-50 p-3 text-xs font-semibold text-indigo-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{extractMessage || 'Đang bóc tách và phân tích câu hỏi...'}</span>
                </div>
              )}

              {fileInfo && !isExtracting && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <FileCode className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">{fileInfo.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {fileInfo.type} • {fileInfo.size}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Đã đọc xong
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Dán toàn bộ nội dung đề thi vào đây:
              </label>
              <textarea
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={8}
                placeholder="Câu 1: ...&#10;A. ...&#10;B. ...&#10;C. ...&#10;D. ...&#10;Đáp án: A"
                className="w-full rounded-xl border border-gray-200 p-3.5 text-xs font-mono text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
              />
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Extraction summary preview */}
          {parsedQuestions.length > 0 && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Nhận diện thành công: {parsedQuestions.length} câu hỏi
                </span>
                <span className="text-[11px] font-semibold text-indigo-700">
                  Chuẩn GDPT 2018
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-white p-2 border border-indigo-100 shadow-2xs">
                  <p className="font-bold text-gray-900">{mcCount}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Trắc nghiệm ABCD</p>
                </div>
                <div className="rounded-lg bg-white p-2 border border-indigo-100 shadow-2xs">
                  <p className="font-bold text-gray-900">{tfCount}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Đúng / Sai (a,b,c,d)</p>
                </div>
                <div className="rounded-lg bg-white p-2 border border-indigo-100 shadow-2xs">
                  <p className="font-bold text-gray-900">{saCount}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Trả lời ngắn</p>
                </div>
              </div>
            </div>
          )}

          {/* Action options */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700">
                Phương thức nạp vào đề thi:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`flex flex-col text-left p-3 rounded-xl border transition ${
                    importMode === 'replace'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xs font-bold">Ghi đè toàn bộ</span>
                  <span className="text-[10px] text-gray-500 mt-0.5">
                    Thay thế danh sách {currentCount} câu hiện tại bằng {parsedQuestions.length} câu mới.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`flex flex-col text-left p-3 rounded-xl border transition ${
                    importMode === 'append'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xs font-bold">Nối tiếp vào sau</span>
                  <span className="text-[10px] text-gray-500 mt-0.5">
                    Thêm {parsedQuestions.length} câu mới vào sau {currentCount} câu hiện có.
                  </span>
                </button>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDistribute}
                  onChange={(e) => setAutoDistribute(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-700 font-medium">
                  Tự động chia đều thang điểm 10.00 cho tất cả câu hỏi sau khi nạp
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 px-6 py-3.5 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={parsedQuestions.length === 0 || isExtracting}
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>Nạp {parsedQuestions.length > 0 ? `${parsedQuestions.length} câu hỏi` : ''} vào đề</span>
          </button>
        </div>
      </div>
    </div>
  );
}
