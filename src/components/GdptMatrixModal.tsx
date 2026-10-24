'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Question } from '../types/exam';
import {
  countQuestionTypes,
  calculateMatrixTotal,
  autoSuggestMatrixConfig,
  applyGdptMatrix,
  GDPT_PRESETS,
  GdptMatrixConfig,
} from '../utils/gdptMatrix';
import {
  X,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  Scale,
  Award,
  BookOpen,
  HelpCircle,
  Check,
} from 'lucide-react';

interface GdptMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onApplyMatrix: (updatedQuestions: Question[]) => void;
}

export const GdptMatrixModal: React.FC<GdptMatrixModalProps> = ({
  isOpen,
  onClose,
  questions,
  onApplyMatrix,
}) => {
  const counts = useMemo(() => countQuestionTypes(questions), [questions]);

  const [config, setConfig] = useState<GdptMatrixConfig>({
    part1ScorePerQuestion: 0.25,
    part2ScorePerQuestion: 1.00,
    part3ScorePerQuestion: 0.25,
    targetTotalScore: 10.0,
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Auto-suggest optimal configuration when opened
  useEffect(() => {
    if (isOpen && questions.length > 0) {
      const suggested = autoSuggestMatrixConfig(counts, 10);
      setConfig(suggested);
      // Auto-detect preset if matches exactly
      if (counts.part1Count === 18 && counts.part2Count === 4 && counts.part3Count === 6) {
        setSelectedPresetId('khtn');
      } else if (counts.part1Count === 12 && counts.part2Count === 4 && counts.part3Count === 6) {
        setSelectedPresetId('math');
      } else {
        setSelectedPresetId(null);
      }
    }
  }, [isOpen, questions, counts]);

  if (!isOpen) return null;

  const currentTotal = calculateMatrixTotal(counts, config);
  const isPerfectTen = Math.abs(currentTotal - config.targetTotalScore) < 0.01;

  const handleApplyPreset = (preset: typeof GDPT_PRESETS[0]) => {
    setSelectedPresetId(preset.id);
    setConfig({
      part1ScorePerQuestion: preset.part1Score,
      part2ScorePerQuestion: preset.part2Score,
      part3ScorePerQuestion: preset.part3Score,
      targetTotalScore: preset.targetTotalScore,
    });
  };

  const handleAutoBalance = () => {
    const suggested = autoSuggestMatrixConfig(counts, config.targetTotalScore || 10);
    setConfig(suggested);
    setSelectedPresetId(null);
  };

  const handleSaveAndApply = () => {
    const updated = applyGdptMatrix(questions, config);
    onApplyMatrix(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  Cấu hình Ma trận điểm chuẩn GDPT 2018
                </h2>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  Bộ GD&ĐT
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Phân bổ điểm chính xác cho 3 phần thi theo ma trận định dạng mới
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Mẫu ma trận khuyến nghị (Bộ GD&ĐT)
              </label>
              <button
                type="button"
                onClick={handleAutoBalance}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                title="Tự động tính tỷ lệ điểm tối ưu theo số lượng câu hỏi hiện tại"
              >
                <Scale className="h-3 w-3" />
                <span>Tự động cân đối về 10đ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {GDPT_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`text-left rounded-xl p-3 border text-xs transition relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500'
                        : 'border-gray-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="font-bold text-gray-900 pr-5 mb-1">{preset.name}</div>
                    <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">
                      {preset.description}
                    </p>
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Breakdown for the 3 Parts */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
            <div className="bg-slate-50/80 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between text-xs font-bold text-gray-700">
              <span>Thành phần câu hỏi trong đề ({counts.totalCount} câu)</span>
              <span>Điểm mỗi câu</span>
            </div>

            <div className="divide-y divide-gray-100 p-1">
              {/* Part I: Multiple Choice */}
              <div className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 rounded-xl transition">
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 text-[11px] font-bold text-blue-700">
                      I
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      Phần I. Trắc nghiệm nhiều phương án (A, B, C, D)
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                      {counts.part1Count} câu
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 pl-7">
                    Thường 0.25đ/câu. Tổng phần I: {(counts.part1Count * config.part1ScorePerQuestion).toFixed(2)} điểm
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    disabled={counts.part1Count === 0}
                    value={config.part1ScorePerQuestion}
                    onChange={(e) => {
                      setSelectedPresetId(null);
                      setConfig({ ...config, part1ScorePerQuestion: Math.max(0, parseFloat(e.target.value) || 0) });
                    }}
                    className="w-20 rounded-xl border border-gray-300 px-2.5 py-1.5 text-center text-xs font-bold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:opacity-50"
                  />
                  <span className="text-xs text-gray-400 font-semibold">đ</span>
                </div>
              </div>

              {/* Part II: True / False */}
              <div className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 rounded-xl transition">
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-100 text-[11px] font-bold text-purple-700">
                      II
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      Phần II. Trắc nghiệm Đúng / Sai (4 ý a, b, c, d)
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                      {counts.part2Count} câu
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 pl-7">
                    Chuẩn 1.00đ/câu (Đúng 1 ý = 0.1đ, 2 ý = 0.25đ, 3 ý = 0.5đ, 4 ý = 1.0đ). Tổng: {(counts.part2Count * config.part2ScorePerQuestion).toFixed(2)}đ
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    disabled={counts.part2Count === 0}
                    value={config.part2ScorePerQuestion}
                    onChange={(e) => {
                      setSelectedPresetId(null);
                      setConfig({ ...config, part2ScorePerQuestion: Math.max(0, parseFloat(e.target.value) || 0) });
                    }}
                    className="w-20 rounded-xl border border-gray-300 px-2.5 py-1.5 text-center text-xs font-bold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:opacity-50"
                  />
                  <span className="text-xs text-gray-400 font-semibold">đ</span>
                </div>
              </div>

              {/* Part III: Short Answer */}
              <div className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 rounded-xl transition">
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-[11px] font-bold text-emerald-700">
                      III
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      Phần III. Trắc nghiệm trả lời ngắn (Nhập đáp số)
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                      {counts.part3Count} câu
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 pl-7">
                    Thường 0.25đ hoặc 0.50đ/câu. Tổng phần III: {(counts.part3Count * config.part3ScorePerQuestion).toFixed(2)} điểm
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    disabled={counts.part3Count === 0}
                    value={config.part3ScorePerQuestion}
                    onChange={(e) => {
                      setSelectedPresetId(null);
                      setConfig({ ...config, part3ScorePerQuestion: Math.max(0, parseFloat(e.target.value) || 0) });
                    }}
                    className="w-20 rounded-xl border border-gray-300 px-2.5 py-1.5 text-center text-xs font-bold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:opacity-50"
                  />
                  <span className="text-xs text-gray-400 font-semibold">đ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Total Calculation */}
          <div className={`rounded-xl p-4 border flex items-center justify-between ${
            isPerfectTen
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-2.5">
              {isPerfectTen ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold">
                  {isPerfectTen
                    ? 'Tổng điểm đạt chuẩn 10.00 điểm (Tối ưu Bộ GD&ĐT)'
                    : `Tổng điểm đang tính: ${currentTotal.toFixed(2)} điểm (Lệch ${(currentTotal - 10).toFixed(2)}đ so với 10)`}
                </div>
                <div className="text-[11px] opacity-80">
                  {isPerfectTen
                    ? 'Hệ thống tự động bù trừ phần dư số học để không bao giờ bị lệch điểm.'
                    : 'Bấm nút "Tự động cân đối" để hệ thống tự cân chỉnh điểm các phần về chuẩn 10.00đ.'}
                </div>
              </div>
            </div>

            {!isPerfectTen && (
              <button
                type="button"
                onClick={handleAutoBalance}
                className="shrink-0 flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-700 shadow-xs transition"
              >
                <Scale className="h-3 w-3" />
                <span>Cân đối ngay</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSaveAndApply}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Áp dụng ma trận vào đề thi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
