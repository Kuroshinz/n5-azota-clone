'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Exam, Question } from '@/types/exam';
import { getExam } from '@/storage/examStorage';
import { MathView } from '@/components/MathView';
import {
  Printer,
  Download,
  ArrowLeft,
  CheckCircle,
  FileText,
  Settings2,
  Eye,
  EyeOff,
  Sparkles,
  HelpCircle,
  Edit3
} from 'lucide-react';

export default function ExamPrintPage() {
  const params = useParams();
  const router = useRouter();
  const examId = (params?.id as string) || '';

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  // Print settings
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [includeAnswerSheet, setIncludeAnswerSheet] = useState(true);
  const [examCode, setExamCode] = useState('101');
  const [schoolHeader, setSchoolHeader] = useState('BỘ GIÁO DỤC VÀ ĐÀO TẠO / HỆ THỐNG KHẢO THÍ N5EXAM');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!examId) return;

    // 1. Initial local storage load
    const cached = getExam(examId);
    if (cached) {
      setExam(cached);
      setLoading(false);
    }

    // 2. Fetch server database state
    fetch(`/api/exams/${examId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.exam) {
          setExam(data.exam);
        }
      })
      .catch(err => console.warn('Could not fetch exam for print', err))
      .finally(() => setLoading(false));
  }, [examId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    if (!exam) return;

    const printElement = printAreaRef.current;
    if (!printElement) return;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${exam.title}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.35; color: #000; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .header-table td { vertical-align: top; }
          .question-title { font-weight: bold; margin-top: 14px; margin-bottom: 4px; }
          .options-table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 10px; }
          .options-table td { width: 50%; vertical-align: top; padding: 3px 0; }
          .answer-key-box { border: 1px solid #000; padding: 10px; margin-top: 25px; page-break-before: always; }
          .answer-table { border-collapse: collapse; width: 100%; text-align: center; }
          .answer-table th, .answer-table td { border: 1px solid #000; padding: 4px 8px; }
        </style>
      </head>
      <body>
        ${printElement.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + htmlContent], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(exam.title || 'De_thi').replace(/[^a-zA-Z0-9_-]/g, '_')}_MaDe_${examCode}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500 font-medium">
        Đang tải bản in đề thi...
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-700 font-bold mb-4">Không tìm thấy thông tin đề thi để in!</p>
        <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
          Quay về Trang chủ
        </Link>
      </div>
    );
  }

  // Categorize questions
  const multipleChoiceQs = (exam.questions || []).filter(
    q => !q.type || q.type === 'multiple_choice'
  );
  const trueFalseQs = (exam.questions || []).filter(q => q.type === 'true_false');
  const shortAnswerQs = (exam.questions || []).filter(q => q.type === 'short_answer');

  const fontSizeClass =
    fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div className="min-h-screen bg-slate-100/80 text-gray-900">
      {/* Print-Only Style Injection */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm 15mm 15mm 15mm;
          }
          body {
            background: #fff !important;
            color: #000 !important;
            font-family: 'Times New Roman', Times, serif !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          .print-paper {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Floating Action / Control Header (Hidden when printing) */}
      <header className="no-print sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại</span>
            </button>
            <div className="border-l border-gray-200 pl-3">
              <h1 className="text-xs font-bold text-gray-900 truncate max-w-[200px] sm:max-w-[320px]">
                {exam.title}
              </h1>
              <span className="text-[11px] text-gray-500">Chế độ xem & In đề thi chuẩn giấy</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadWord}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs active:scale-95 cursor-pointer"
              title="Tải file Word (.doc) tương thích Microsoft Word"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Tải file Word (.doc)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-md shadow-indigo-200 active:scale-95 cursor-pointer"
              title="In trực tiếp ra máy in hoặc lưu PDF"
            >
              <Printer className="h-4 w-4" />
              <span>In đề thi (Ctrl + P)</span>
            </button>
          </div>
        </div>

        {/* Options Toolbar */}
        <div className="mx-auto mt-2.5 flex max-w-5xl flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAnswerKey}
                onChange={e => setShowAnswerKey(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold text-gray-700">Kèm bảng đáp án</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showExplanations}
                onChange={e => setShowExplanations(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold text-gray-700">Kèm lời giải chi tiết</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAnswerSheet}
                onChange={e => setIncludeAnswerSheet(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold text-gray-700">Kèm phiếu tô trắc nghiệm (A4)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-[11px]">Mã đề:</span>
            <input
              type="text"
              value={examCode}
              onChange={e => setExamCode(e.target.value.trim().slice(0, 5) || '101')}
              className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-center font-bold text-gray-800"
            />
          </div>
        </div>
      </header>

      {/* Main Printable Exam Sheet */}
      <main className="mx-auto max-w-4xl py-6 px-3 sm:px-6">
        <div
          ref={printAreaRef}
          className={`print-paper rounded-2xl border border-gray-200 bg-white p-6 sm:p-12 shadow-md ${fontSizeClass} leading-relaxed text-gray-900`}
        >
          {/* Official Header */}
          <div className="border-b-2 border-gray-900 pb-4 mb-6">
            <div className="grid grid-cols-12 gap-3 text-center">
              <div className="col-span-6 text-left">
                <p className="font-bold uppercase tracking-wide text-xs">{schoolHeader}</p>
                <p className="text-xs text-gray-700 font-semibold mt-0.5">HỆ THỐNG KHẢO THÍ CHUẨN N5EXAM</p>
                <div className="mt-2 text-xs border border-gray-400 p-1.5 inline-block rounded">
                  <span className="font-bold">MÃ ĐỀ THI: {examCode}</span>
                </div>
              </div>

              <div className="col-span-6 text-right">
                <p className="font-black text-sm uppercase tracking-wider">KỲ THI KHẢO SÁT CHẤT LƯỢNG</p>
                <p className="font-bold text-xs uppercase mt-0.5">BÀI THI: {exam.title}</p>
                <p className="text-xs italic text-gray-700 mt-1">
                  Thời gian làm bài: <strong>{exam.durationMinutes} phút</strong> (không kể thời gian phát đề)
                </p>
              </div>
            </div>

            {/* Candidate Identity Section */}
            <div className="mt-4 pt-3 border-t border-dashed border-gray-300 grid grid-cols-12 gap-2 text-xs">
              <div className="col-span-7">
                Họ và tên thí sinh: ............................................................................
              </div>
              <div className="col-span-5 text-right">
                Số báo danh: ............................. Phòng thi: ............
              </div>
            </div>
          </div>

          {/* Exam Questions Content */}
          <div className="space-y-6">
            {/* PART 1: Multiple Choice */}
            {multipleChoiceQs.length > 0 && (
              <section>
                <div className="mb-3">
                  <h2 className="font-black text-sm uppercase tracking-wide">
                    PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn ({multipleChoiceQs.length} câu)
                  </h2>
                  <p className="text-xs italic text-gray-600">
                    Thí sinh trả lời từ câu 1 đến câu {multipleChoiceQs.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
                  </p>
                </div>

                <div className="space-y-4">
                  {multipleChoiceQs.map((q, idx) => (
                    <div key={q.id} className="break-inside-avoid">
                      <div className="font-bold text-gray-900 mb-1 flex items-baseline gap-1">
                        <span>Câu {idx + 1}.</span>
                        {q.audioUrl && (
                          <span className="font-semibold text-blue-700 text-xs italic">[Bài nghe]</span>
                        )}
                        <div className="font-normal inline">
                          <MathView content={q.content} />
                        </div>
                      </div>

                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pl-4 mt-1.5">
                          {q.options.map(opt => (
                            <div key={opt.key} className="flex items-baseline gap-1.5 text-gray-800">
                              <span className="font-bold">{opt.key}.</span>
                              <div>
                                <MathView content={opt.content} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {showExplanations && q.explanation && (
                        <div className="mt-2 pl-4 text-xs italic text-emerald-800 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                          <strong>Đáp án: {q.correctAnswer}</strong> | Lời giải: {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PART 2: True/False */}
            {trueFalseQs.length > 0 && (
              <section className="pt-4 border-t border-gray-200">
                <div className="mb-3">
                  <h2 className="font-black text-sm uppercase tracking-wide">
                    PHẦN II. Câu trắc nghiệm Đúng / Sai ({trueFalseQs.length} câu)
                  </h2>
                  <p className="text-xs italic text-gray-600">
                    Thí sinh trả lời các ý a), b), c), d) ở mỗi câu. Thí sinh chọn Đúng hoặc Sai cho mỗi ý.
                  </p>
                </div>

                <div className="space-y-5">
                  {trueFalseQs.map((q, idx) => (
                    <div key={q.id} className="break-inside-avoid">
                      <div className="font-bold text-gray-900 mb-1 flex items-baseline gap-1">
                        <span>Câu {multipleChoiceQs.length + idx + 1}.</span>
                        <div className="font-normal inline">
                          <MathView content={q.content} />
                        </div>
                      </div>

                      {q.subItems && (
                        <div className="space-y-1 pl-4 mt-1.5">
                          {q.subItems.map(item => (
                            <div key={item.key} className="flex items-baseline gap-2 text-gray-800">
                              <span className="font-bold">{item.key})</span>
                              <div className="flex-1">
                                <MathView content={item.content} />
                              </div>
                              {showAnswerKey && item.correctAnswer !== undefined && (
                                <span className="font-bold text-xs text-indigo-700">
                                  [{item.correctAnswer ? 'Đúng' : 'Sai'}]
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {showExplanations && q.explanation && (
                        <div className="mt-2 pl-4 text-xs italic text-emerald-800 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                          Lời giải: {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PART 3: Short Answer */}
            {shortAnswerQs.length > 0 && (
              <section className="pt-4 border-t border-gray-200">
                <div className="mb-3">
                  <h2 className="font-black text-sm uppercase tracking-wide">
                    PHẦN III. Câu trắc nghiệm trả lời ngắn ({shortAnswerQs.length} câu)
                  </h2>
                  <p className="text-xs italic text-gray-600">
                    Thí sinh điền kết quả cuối cùng vào ô tương ứng trên phiếu trả lời.
                  </p>
                </div>

                <div className="space-y-4">
                  {shortAnswerQs.map((q, idx) => (
                    <div key={q.id} className="break-inside-avoid">
                      <div className="font-bold text-gray-900 mb-1 flex items-baseline gap-1">
                        <span>Câu {multipleChoiceQs.length + trueFalseQs.length + idx + 1}.</span>
                        <div className="font-normal inline">
                          <MathView content={q.content} />
                        </div>
                      </div>

                      {showAnswerKey && q.acceptedAnswers && (
                        <div className="mt-1 pl-4 text-xs font-bold text-indigo-700">
                          Đáp số: {q.acceptedAnswers.join(' hoặc ')}
                        </div>
                      )}

                      {showExplanations && q.explanation && (
                        <div className="mt-1 pl-4 text-xs italic text-emerald-800 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                          Lời giải: {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="text-center font-bold tracking-widest my-8 text-xs">
            --- HẾT ---
          </div>

          {/* Printable Answer Key Sheet */}
          {showAnswerKey && (
            <div className="page-break pt-6 border-t-2 border-gray-900">
              <h3 className="text-center font-black uppercase text-sm mb-4">
                BẢNG ĐÁP ÁN CHÍNH THỨC - MÃ ĐỀ: {examCode}
              </h3>

              {multipleChoiceQs.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-bold text-xs mb-2">PHẦN I (Trắc nghiệm):</h4>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 text-center text-xs">
                    {multipleChoiceQs.map((q, idx) => (
                      <div key={q.id} className="border border-gray-300 p-1 rounded">
                        <span className="block text-[10px] text-gray-500">C{idx + 1}</span>
                        <strong className="text-indigo-700 text-sm">{q.correctAnswer || '-'}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {trueFalseQs.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-bold text-xs mb-2">PHẦN II (Đúng / Sai):</h4>
                  <div className="space-y-1 text-xs">
                    {trueFalseQs.map((q, idx) => (
                      <div key={q.id} className="flex items-center gap-3 border-b border-gray-100 py-1">
                        <span className="font-bold">Câu {multipleChoiceQs.length + idx + 1}:</span>
                        {(q.subItems || []).map(s => (
                          <span key={s.key} className="inline-flex items-center gap-0.5">
                            <strong>{s.key}:</strong> {s.correctAnswer ? 'Đ' : 'S'}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {shortAnswerQs.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-bold text-xs mb-2">PHẦN III (Trả lời ngắn):</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {shortAnswerQs.map((q, idx) => (
                      <div key={q.id} className="border border-gray-300 p-1.5 rounded">
                        <span className="text-gray-500 text-[11px] block">
                          Câu {multipleChoiceQs.length + trueFalseQs.length + idx + 1}:
                        </span>
                        <strong className="text-emerald-700">{q.acceptedAnswers?.join(' | ') || '-'}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Printable Answer Bubble Sheet */}
          {includeAnswerSheet && (
            <div className="page-break pt-6 border-t-2 border-gray-900">
              <div className="text-center mb-4">
                <h3 className="font-black uppercase text-sm">
                  PHIẾU TRẢ LỜI TRẮC NGHIỆM TIÊU CHUẨN
                </h3>
                <p className="text-[11px] text-gray-600 italic">
                  Thí sinh dùng bút chì 2B để tô kín ô tròn chứa chữ cái đáp án lựa chọn
                </p>
              </div>

              <div className="border border-gray-400 p-3 rounded mb-4 grid grid-cols-12 gap-2 text-xs">
                <div className="col-span-8">
                  Họ tên thí sinh: ................................................................ Lớp: ..............
                </div>
                <div className="col-span-4 text-right">
                  Số báo danh: ...................... Mã đề: <strong>{examCode}</strong>
                </div>
              </div>

              {/* Bubble Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {Array.from({ length: Math.ceil(exam.totalQuestions / 4) }).map((_, colIdx) => (
                  <div key={colIdx} className="space-y-1.5">
                    {exam.questions.slice(colIdx * 10, colIdx * 10 + 10).map((q, rowIdx) => {
                      const qNum = colIdx * 10 + rowIdx + 1;
                      return (
                        <div key={q.id} className="flex items-center justify-between border-b border-gray-100 pb-1">
                          <span className="font-bold text-gray-700 w-8">{qNum}.</span>
                          <div className="flex items-center gap-1.5">
                            {['A', 'B', 'C', 'D'].map(letter => (
                              <span
                                key={letter}
                                className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-700 text-[10px] font-bold text-gray-800"
                              >
                                {letter}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
