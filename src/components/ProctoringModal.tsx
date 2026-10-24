'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';
import { ProctoringEvent } from '../types/proctoring';

interface ProctoringModalProps {
  isOpen: boolean;
  violationCount: number;
  maxViolations?: number;
  isAutoSubmitting?: boolean;
  latestViolation: ProctoringEvent | null;
  onDismiss: () => void;
}

export const ProctoringModal: React.FC<ProctoringModalProps> = ({
  isOpen,
  violationCount,
  maxViolations = 0,
  isAutoSubmitting = false,
  latestViolation,
  onDismiss,
}) => {
  if (!isOpen) return null;

  const isLimitReached = maxViolations > 0 && violationCount >= maxViolations;

  let violationLabel = 'Rời khỏi màn hình thi hoặc chuyển tab';
  if (latestViolation?.type === 'fullscreen_exit') {
    violationLabel = 'Thoát chế độ toàn màn hình';
  } else if (latestViolation?.type === 'inactivity') {
    violationLabel = 'Không có tương tác trong thời gian dài';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center border-2 border-rose-300">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 animate-pulse">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {isLimitReached ? 'BÀI THI BỊ CƯỠNG CHẾ THU' : 'CẢNH BÁO VI PHẠM THI'}
        </h3>

        <div className="mb-4 rounded-xl bg-rose-50 p-4 border border-rose-200 text-sm text-rose-800 font-medium">
          <div className="flex items-center justify-center gap-1.5 mb-1.5 text-rose-900 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            <span>Phát hiện: {violationLabel}</span>
          </div>

          <p className="text-xs text-rose-700 leading-relaxed">
            {maxViolations > 0 ? (
              <>
                Số lần vi phạm: <strong className="text-rose-900 font-bold">{violationCount} / {maxViolations}</strong> lần.
              </>
            ) : (
              <>
                Hệ thống đã ghi nhận <strong>{violationCount}</strong> lần vi phạm và báo cáo tới giáo viên.
              </>
            )}
          </p>

          {isLimitReached && (
            <div className="mt-2 text-xs font-bold text-rose-800 bg-rose-100/80 rounded-lg p-2">
              Bạn đã vượt quá giới hạn vi phạm cho phép. Hệ thống đang tự động thu bài và gửi kết quả!
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          {isLimitReached
            ? 'Vui lòng không đóng trình duyệt trong khi hệ thống đang xử lý bài nộp.'
            : 'Vui lòng giữ nguyên cửa sổ thi ở chế độ toàn màn hình, không mở ứng dụng hoặc tab khác cho đến khi hoàn thành bài thi.'}
        </p>

        {isLimitReached || isAutoSubmitting ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white shadow-md">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang tự động nộp bài...</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-[0.99] transition"
          >
            Quay lại làm bài thi
          </button>
        )}
      </div>
    </div>
  );
};
