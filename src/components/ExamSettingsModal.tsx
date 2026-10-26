'use client';

import React, { useState, useEffect } from 'react';
import { ExamSettings, DEFAULT_EXAM_SETTINGS } from '../types/exam';
import {
  Settings,
  ShieldCheck,
  BookOpen,
  Lock,
  Clock,
  Shuffle,
  Eye,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';

interface ExamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ExamSettings;
  onSaveSettings: (newSettings: ExamSettings) => void;
}

export const ExamSettingsModal: React.FC<ExamSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<ExamSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings || DEFAULT_EXAM_SETTINGS);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Cấu hình Đề thi & Giám sát</h2>
              <p className="text-xs text-gray-500">Tùy chỉnh chế độ ôn tập, mật khẩu, thời gian và chống gian lận</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Practice vs Proctoring mode toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              1. Chế độ làm bài
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Practice Mode Card */}
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, enableProctoring: false })}
                className={`flex flex-col text-left p-4 rounded-xl border-2 transition ${
                  !localSettings.enableProctoring
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-sm ring-1 ring-emerald-500'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                    <BookOpen className="h-4 w-4" />
                    Chế độ Ôn tập / Tự do
                  </span>
                  {!localSettings.enableProctoring && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Không ép toàn màn hình, học sinh thoải mái chuyển tab tra cứu tài liệu, không cảnh báo vi phạm.
                </p>
              </button>

              {/* Proctoring Mode Card */}
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, enableProctoring: true })}
                className={`flex flex-col text-left p-4 rounded-xl border-2 transition ${
                  localSettings.enableProctoring
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-sm ring-1 ring-indigo-600'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-indigo-700">
                    <ShieldCheck className="h-4 w-4" />
                    Thi có Giám sát nghiêm ngặt
                  </span>
                  {localSettings.enableProctoring && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Bắt buộc toàn màn hình, phát hiện chuyển tab, cảnh báo gian lận và tự động thu bài nếu quá giới hạn.
                </p>
              </button>
            </div>
          </div>

          {/* Section 2: Strict proctoring sub-options (only shown when proctoring enabled) */}
          {localSettings.enableProctoring && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Cấu hình Cưỡng chế Thu bài khi Gian lận
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-800">Giới hạn vi phạm cho phép</span>
                  <p className="text-xs text-gray-500">Tự động nộp bài khi học sinh chuyển tab/thoát toàn màn hình quá mức</p>
                </div>
                <select
                  value={localSettings.maxViolations}
                  onChange={(e) => setLocalSettings({ ...localSettings, maxViolations: Number(e.target.value) })}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={1}>1 lần (Cực kỳ nghiêm ngặt)</option>
                  <option value={3}>3 lần (Tiêu chuẩn N5Exam)</option>
                  <option value={5}>5 lần (Linh hoạt)</option>
                  <option value={0}>Không thu bài (chỉ cảnh báo)</option>
                </select>
              </div>
            </div>
          )}

          {/* Section 3: Password & Timing */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              2. Bảo mật & Thời gian mở đề
            </label>
            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              {/* Password */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <Lock className="h-3.5 w-3.5 text-gray-500" />
                  Mật khẩu vào thi (tùy chọn)
                </label>
                <input
                  type="text"
                  value={localSettings.password || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, password: e.target.value })}
                  placeholder="Để trống nếu cho phép học sinh vào tự do"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                    <Clock className="h-3.5 w-3.5 text-gray-500" />
                    Bắt đầu mở đề
                  </label>
                  <input
                    type="datetime-local"
                    value={localSettings.startTime ? localSettings.startTime.slice(0, 16) : ''}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        startTime: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                    <Clock className="h-3.5 w-3.5 text-gray-500" />
                    Hạn chót nộp bài
                  </label>
                  <input
                    type="datetime-local"
                    value={localSettings.endTime ? localSettings.endTime.slice(0, 16) : ''}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        endTime: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Shuffling */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              3. Đảo đề thi ngẫu nhiên
            </label>
            <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <Shuffle className="h-4 w-4 text-indigo-500" />
                  Đảo thứ tự câu hỏi
                </span>
                <input
                  type="checkbox"
                  checked={localSettings.shuffleQuestions}
                  onChange={(e) => setLocalSettings({ ...localSettings, shuffleQuestions: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <hr className="border-gray-200" />
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <Shuffle className="h-4 w-4 text-indigo-500" />
                  Đảo thứ tự đáp án A/B/C/D
                </span>
                <input
                  type="checkbox"
                  checked={localSettings.shuffleOptions}
                  onChange={(e) => setLocalSettings({ ...localSettings, shuffleOptions: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          {/* Section 5: Show results policy */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              4. Quyền xem kết quả sau khi thi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, showResultAfterSubmit: 'score_and_answers' })}
                className={`p-3 rounded-lg border text-left text-xs transition ${
                  localSettings.showResultAfterSubmit === 'score_and_answers'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold mb-0.5">Điểm & Đáp án</div>
                <div className="text-[11px] text-gray-500 font-normal">Hiện điểm, đáp án đúng & lời giải chi tiết</div>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, showResultAfterSubmit: 'score_only' })}
                className={`p-3 rounded-lg border text-left text-xs transition ${
                  localSettings.showResultAfterSubmit === 'score_only'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold mb-0.5">Chỉ xem điểm</div>
                <div className="text-[11px] text-gray-500 font-normal">Ẩn đáp án đúng và lời giải chi tiết</div>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, showResultAfterSubmit: 'hidden' })}
                className={`p-3 rounded-lg border text-left text-xs transition ${
                  localSettings.showResultAfterSubmit === 'hidden'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold mb-0.5">Ẩn kết quả</div>
                <div className="text-[11px] text-gray-500 font-normal">Chờ giáo viên công bố điểm sau</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Check className="h-4 w-4" />
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
};
