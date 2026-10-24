'use client';

import React, { useState } from 'react';
import { Question, Option, SubQuestionItem, OptionKey } from '../types/exam';
import { MathView } from './MathView';
import {
  Trash2,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Check,
  X,
  Type,
  ListOrdered,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

interface QuestionEditorCardProps {
  question: Question;
  displayNumber: number;
  onChange: (updated: Question) => void;
  onDelete: () => void;
}

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];
const SUB_KEYS: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];

export const QuestionEditorCard: React.FC<QuestionEditorCardProps> = ({
  question,
  displayNumber,
  onChange,
  onDelete,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const qType = question.type || 'multiple_choice';

  const handleTypeChange = (newType: 'multiple_choice' | 'true_false' | 'short_answer') => {
    if (newType === question.type) return;

    let updated: Question = { ...question, type: newType };
    if (newType === 'multiple_choice' && (!updated.options || updated.options.length === 0)) {
      updated.options = [
        { key: 'A', content: '' },
        { key: 'B', content: '' },
        { key: 'C', content: '' },
        { key: 'D', content: '' },
      ];
      updated.correctAnswer = 'A';
    } else if (newType === 'true_false' && (!updated.subItems || updated.subItems.length === 0)) {
      updated.subItems = [
        { key: 'a', content: '', correctAnswer: true },
        { key: 'b', content: '', correctAnswer: false },
        { key: 'c', content: '', correctAnswer: true },
        { key: 'd', content: '', correctAnswer: false },
      ];
    } else if (newType === 'short_answer' && (!updated.acceptedAnswers || updated.acceptedAnswers.length === 0)) {
      updated.acceptedAnswers = [''];
    }
    onChange(updated);
  };

  const handleScoreChange = (score: number) => {
    onChange({ ...question, score: Math.max(0, score) });
  };

  const handleContentChange = (content: string) => {
    onChange({ ...question, content });
  };

  const handleExplanationChange = (explanation: string) => {
    onChange({ ...question, explanation });
  };

  // Multiple Choice Handlers
  const handleOptionContentChange = (index: number, content: string) => {
    const nextOptions = [...(question.options || [])];
    if (nextOptions[index]) {
      nextOptions[index] = { ...nextOptions[index], content };
      onChange({ ...question, options: nextOptions });
    }
  };

  const handleSetCorrectAnswer = (key: OptionKey) => {
    onChange({ ...question, correctAnswer: key });
  };

  const handleAddOption = () => {
    const nextOptions = [...(question.options || [])];
    if (nextOptions.length >= 4) return;
    const nextKey = OPTION_KEYS[nextOptions.length] || 'D';
    nextOptions.push({ key: nextKey, content: '' });
    onChange({ ...question, options: nextOptions });
  };

  const handleDeleteOption = (index: number) => {
    const nextOptions = (question.options || []).filter((_, idx) => idx !== index);
    let nextCorrect = question.correctAnswer;
    if (nextCorrect && !nextOptions.some(o => o.key === nextCorrect)) {
      nextCorrect = nextOptions[0]?.key;
    }
    onChange({ ...question, options: nextOptions, correctAnswer: nextCorrect });
  };

  // True/False SubItems Handlers
  const handleSubItemContentChange = (index: number, content: string) => {
    const nextSubItems = [...(question.subItems || [])];
    if (nextSubItems[index]) {
      nextSubItems[index] = { ...nextSubItems[index], content };
      onChange({ ...question, subItems: nextSubItems });
    }
  };

  const handleSubItemCorrectChange = (index: number, isCorrect: boolean) => {
    const nextSubItems = [...(question.subItems || [])];
    if (nextSubItems[index]) {
      nextSubItems[index] = { ...nextSubItems[index], correctAnswer: isCorrect };
      onChange({ ...question, subItems: nextSubItems });
    }
  };

  const handleAddSubItem = () => {
    const nextSubItems = [...(question.subItems || [])];
    if (nextSubItems.length >= 4) return;
    const nextKey = SUB_KEYS[nextSubItems.length] || 'd';
    nextSubItems.push({ key: nextKey, content: '', correctAnswer: true });
    onChange({ ...question, subItems: nextSubItems });
  };

  const handleDeleteSubItem = (index: number) => {
    const nextSubItems = (question.subItems || []).filter((_, idx) => idx !== index);
    onChange({ ...question, subItems: nextSubItems });
  };

  // Short Answer Handlers
  const handleAcceptedAnswersChange = (answersText: string) => {
    const parts = answersText.split(',').map(s => s.trim()).filter(Boolean);
    onChange({ ...question, acceptedAnswers: parts });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Top Bar: Question Number, Type Selector, Score, Actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 px-3 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm">
            Câu {displayNumber}
          </span>

          {/* Type Selector Dropdown */}
          <div className="relative">
            <select
              value={qType}
              onChange={(e) => handleTypeChange(e.target.value as any)}
              className="appearance-none rounded-lg border border-gray-200 bg-slate-50 py-1 pl-2.5 pr-7 text-xs font-semibold text-gray-700 hover:bg-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="multiple_choice">Dạng 1: Trắc nghiệm (A, B, C, D)</option>
              <option value="true_false">Dạng 2: Đúng / Sai (a, b, c, d)</option>
              <option value="short_answer">Dạng 3: Trả lời ngắn</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2 h-3 w-3 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Score Input */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="font-medium">Điểm:</span>
            <input
              type="number"
              step="0.1"
              min="0"
              value={question.score ?? 0.25}
              onChange={(e) => handleScoreChange(parseFloat(e.target.value) || 0)}
              className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-xs font-bold text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Preview LaTeX toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              showPreview
                ? 'bg-indigo-100 text-indigo-700 font-bold'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Bật/Tắt xem trước công thức LaTeX"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{showPreview ? 'Đóng xem trước' : 'Xem trước'}</span>
          </button>

          {/* Delete Question */}
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
            title="Xóa câu hỏi này"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Xóa câu</span>
          </button>
        </div>
      </div>

      {/* Question Content Editor */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Nội dung câu hỏi:
        </label>
        <textarea
          rows={3}
          value={question.content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Nhập nội dung câu hỏi (hỗ trợ KaTeX như $x^2 + 1 = 0$)..."
          className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal leading-relaxed"
        />

        {showPreview && question.content && (
          <div className="mt-2 rounded-xl bg-slate-50 p-3 border border-slate-200 text-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Xem trước hiển thị:
            </span>
            <MathView content={question.content} />
          </div>
        )}
      </div>

      {/* Specific Mode Editor */}
      {/* 1. Multiple Choice Options */}
      {qType === 'multiple_choice' && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700">
              Các phương án trả lời <span className="text-indigo-600 font-normal">(Click vào chữ cái để chọn ĐÁP ÁN ĐÚNG)</span>:
            </label>
            {(question.options?.length ?? 0) < 4 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm phương án</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(question.options || []).map((opt, idx) => {
              const isCorrect = question.correctAnswer === opt.key;

              return (
                <div
                  key={opt.key}
                  className={`flex items-center gap-2 rounded-xl border p-2 transition ${
                    isCorrect
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {/* Clickable Badge to set Correct Answer */}
                  <button
                    type="button"
                    onClick={() => handleSetCorrectAnswer(opt.key)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition ${
                      isCorrect
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={isCorrect ? 'Đáp án đúng (Click để đổi)' : 'Click để chọn làm đáp án đúng'}
                  >
                    {opt.key}
                  </button>

                  <input
                    type="text"
                    value={opt.content}
                    onChange={(e) => handleOptionContentChange(idx, e.target.value)}
                    placeholder={`Nội dung đáp án ${opt.key}...`}
                    className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                  />

                  {isCorrect && (
                    <span className="text-[11px] font-bold text-emerald-700 shrink-0 flex items-center gap-0.5">
                      <Check className="h-3 w-3" /> Đúng
                    </span>
                  )}

                  {(question.options?.length ?? 0) > 2 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(idx)}
                      className="text-gray-400 hover:text-rose-500 transition p-1"
                      title="Xóa phương án này"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. True / False Sub-items */}
      {qType === 'true_false' && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700">
              Các mệnh đề khẳng định a), b), c), d):
            </label>
            {(question.subItems?.length ?? 0) < 4 && (
              <button
                type="button"
                onClick={handleAddSubItem}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm ý</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {(question.subItems || []).map((item, idx) => (
              <div key={item.key} className="flex items-center gap-3 p-3 hover:bg-slate-50/50 transition">
                <span className="font-bold text-indigo-700 text-sm shrink-0">
                  {item.key})
                </span>

                <input
                  type="text"
                  value={item.content}
                  onChange={(e) => handleSubItemContentChange(idx, e.target.value)}
                  placeholder={`Nội dung khẳng định ý ${item.key}...`}
                  className="flex-1 text-sm text-gray-800 bg-transparent focus:outline-none"
                />

                {/* Đúng / Sai Toggle Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSubItemCorrectChange(idx, true)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                      item.correctAnswer === true
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <Check className="h-3 w-3" />
                    <span>Đúng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubItemCorrectChange(idx, false)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                      item.correctAnswer === false
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <X className="h-3 w-3" />
                    <span>Sai</span>
                  </button>

                  {(question.subItems?.length ?? 0) > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSubItem(idx)}
                      className="text-gray-400 hover:text-rose-500 transition p-1 ml-1"
                      title="Xóa ý này"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Short Answer Accepted Answers */}
      {qType === 'short_answer' && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Đáp án chấp nhận (các giá trị cách nhau bằng dấu phẩy):
          </label>
          <input
            type="text"
            value={(question.acceptedAnswers || []).join(', ')}
            onChange={(e) => handleAcceptedAnswersChange(e.target.value)}
            placeholder="Ví dụ: 12.5, 25/2, 12,5"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Học sinh nhập trùng với bất kỳ giá trị nào ở trên đều được tính điểm tối đa.
          </p>
        </div>
      )}

      {/* Explanation Editor */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Lời giải chi tiết (hiển thị sau khi nộp bài):
        </label>
        <textarea
          rows={2}
          value={question.explanation || ''}
          onChange={(e) => handleExplanationChange(e.target.value)}
          placeholder="Nhập lời giải hoặc hướng dẫn chi tiết..."
          className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal leading-relaxed"
        />
      </div>
    </div>
  );
};
