'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Share2,
  Clock,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export interface ShareExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  examTitle: string;
  durationMinutes: number;
  totalQuestions: number;
}

export const ShareExamModal: React.FC<ShareExamModalProps> = ({
  isOpen,
  onClose,
  examId,
  examTitle,
  durationMinutes,
  totalQuestions,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const examUrl = `${origin}/exam/${examId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    examUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(examUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Share2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Chia sẻ đề thi</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                <Sparkles className="h-3 w-3" />
                Đã xuất bản
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-1">{examTitle}</p>
          </div>
        </div>

        {/* Exam Badges */}
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-indigo-600" />
            <span>Thời gian: <strong>{durationMinutes} phút</strong></span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
            <span>Số câu: <strong>{totalQuestions} câu</strong></span>
          </div>
        </div>

        {/* Link Share Box */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Đường link làm bài trực tiếp cho học sinh:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={examUrl}
              className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-mono text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Đã chép!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="mb-5 flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
          <div className="shrink-0 rounded-xl bg-white p-2 border border-indigo-100 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt="QR Code vào phòng thi"
              className="h-28 w-28 object-contain"
            />
          </div>
          <div className="text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
              <QrCode className="h-4 w-4 text-indigo-600" />
              <span>Mã QR quét nhanh vào thi</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Học sinh có thể dùng Camera điện thoại hoặc ứng dụng Zalo quét mã QR để vào ngay phòng thi mà không cần gõ link.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            <Link
              href={`/exam/${examId}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <span>Vào thi thử</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/teacher/exams"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Danh sách đề
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
