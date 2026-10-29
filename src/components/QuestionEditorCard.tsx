'use client';

import React, { useState } from 'react';
import { Question, Option, SubQuestionItem, OptionKey } from '../types/exam';
import { normalizeQuestion } from '../parser/examParser';
import { hasFormulaOrCharacterIssue, fixQuestionFormulaErrors } from '../parser/mathConverter';
import { MathView } from './MathView';
import {
  Volume2,
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
  Sparkles,
  Table,
  Sigma,
} from 'lucide-react';

interface QuestionEditorCardProps {
  question: Question;
  displayNumber: number;
  onChange: (updated: Question) => void;
  onDelete: () => void;
  onInsertBelow?: () => void;
}

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

export const QuestionEditorCard: React.FC<QuestionEditorCardProps> = ({
  question,
  displayNumber,
  onChange,
  onDelete,
  onInsertBelow,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const qType = question.type || 'multiple_choice';

  const handleAutoCleanQuestion = () => {
    const cleaned = normalizeQuestion(question);
    onChange(cleaned);
  };

  const handleAutoFixCharacters = () => {
    const { question: fixed, fixedCount } = fixQuestionFormulaErrors(question);
    if (fixedCount > 0) {
      onChange(fixed);
    }
  };

  const hasFormulaIssue = React.useMemo(() => {
    if (hasFormulaOrCharacterIssue(question.content || '')) return true;
    if (hasFormulaOrCharacterIssue(question.explanation || '')) return true;
    if (question.options?.some((o) => hasFormulaOrCharacterIssue(o.content || ''))) return true;
    if (question.subItems?.some((s) => hasFormulaOrCharacterIssue(s.content || ''))) return true;
    return false;
  }, [question]);

  const hasIssues = React.useMemo(() => {
    if (qType === 'multiple_choice') {
      const opts = question.options || [];
      const hasEmpty = opts.some(o => !o.content || o.content.trim().length === 0);
      const hasDuplicateKey = new Set(opts.map(o => o.key)).size !== opts.length;
      const hasOver4 = opts.length > 4;
      const hasPrefixDuplicate = opts.some(o => /^(\*?[A-D][.:)\-]\s*)+/i.test(o.content));
      return hasEmpty || hasDuplicateKey || hasOver4 || hasPrefixDuplicate;
    }
    return false;
  }, [question, qType]);

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
    if (question.correctAnswer === question.options?.[index]?.key) {
      nextCorrect = nextOptions[0]?.key || 'A';
    }
    onChange({ ...question, options: nextOptions, correctAnswer: nextCorrect });
  };

  // True / False Handlers
  const handleSubItemContentChange = (index: number, content: string) => {
    const nextSubItems = [...(question.subItems || [])];
    if (nextSubItems[index]) {
      nextSubItems[index] = { ...nextSubItems[index], content };
      onChange({ ...question, subItems: nextSubItems });
    }
  };

  const handleSubItemCorrectChange = (index: number, val: boolean) => {
    const nextSubItems = [...(question.subItems || [])];
    if (nextSubItems[index]) {
      nextSubItems[index] = { ...nextSubItems[index], correctAnswer: val };
      onChange({ ...question, subItems: nextSubItems });
    }
  };

  const handleAddSubItem = () => {
    const nextSubItems = [...(question.subItems || [])];
    if (nextSubItems.length >= 4) return;
    const keys: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
    const nextKey = keys[nextSubItems.length] || 'd';
    nextSubItems.push({ key: nextKey, content: '', correctAnswer: true });
    onChange({ ...question, subItems: nextSubItems });
  };

  const handleDeleteSubItem = (index: number) => {
    const nextSubItems = (question.subItems || []).filter((_, idx) => idx !== index);
    onChange({ ...question, subItems: nextSubItems });
  };

  // Short Answer Handlers
  const handleAcceptedAnswersChange = (raw: string) => {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    onChange({ ...question, acceptedAnswers: parts });
  };

  const hasFormulaSyntax = (str: string) => {
    if (!str) return false;
    return str.includes('$') || str.includes('\\') || str.includes('![Hình vẽ]') || str.includes('data:image');
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Top Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          {/* Question Number Badge */}
          <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-indigo-600 px-2 text-xs font-bold text-white shadow-xs">
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
              step="0.05"
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
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              showPreview
                ? 'bg-indigo-100 text-indigo-700 font-bold'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Bật/Tắt xem trước công thức LaTeX"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{showPreview ? 'Đóng xem trước' : 'Xem trước'}</span>
          </button>

          {/* Insert Below Question Button */}
          {onInsertBelow && (
            <button
              type="button"
              onClick={onInsertBelow}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
              title="Chèn một câu hỏi mới ngay bên dưới câu này"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Chèn câu dưới</span>
            </button>
          )}

          {/* Delete Question */}
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Xóa câu hỏi này"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Xóa câu</span>
          </button>
        </div>
      </div>

      {/* Audio / Listening Comprehension Section */}
      <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <Volume2 className="h-4 w-4 text-blue-600" />
            <span>File âm thanh / Nghe hiểu (JLPT Choukai / Tiếng Anh):</span>
          </div>
          {question.audioUrl && (
            <button
              type="button"
              onClick={() => onChange({ ...question, audioUrl: undefined, audioPlayLimit: undefined })}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
            >
              Xóa audio
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={question.audioUrl || ''}
              onChange={(e) => onChange({ ...question, audioUrl: e.target.value.trim() || undefined })}
              placeholder="Dán link audio MP3 (ví dụ: https://domain.com/choukai-mondai1.mp3)..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={question.audioPlayLimit ?? 0}
              onChange={(e) => onChange({ ...question, audioPlayLimit: Number(e.target.value) || undefined })}
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value={0}>Nghe không giới hạn</option>
              <option value={1}>Chỉ nghe 1 lần</option>
              <option value={2}>Nghe tối đa 2 lần (Chuẩn JLPT)</option>
              <option value={3}>Nghe tối đa 3 lần</option>
            </select>
          </div>
        </div>
        {question.audioUrl && (
          <div className="mt-2.5 pt-2 border-t border-blue-100/80 flex items-center gap-2">
            <audio controls src={question.audioUrl} className="w-full h-8 rounded" controlsList="nodownload" />
          </div>
        )}
      </div>

      {hasIssues && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 font-bold">!</span>
            <span>Phát hiện câu hỏi có phương án rỗng, thừa hoặc lặp nhãn (ví dụ trùng phím B)!</span>
          </div>
          <button
            type="button"
            onClick={handleAutoCleanQuestion}
            className="flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-700 transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tự động sửa lỗi</span>
          </button>
        </div>
      )}

      {hasFormulaIssue && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50/90 p-2.5 text-xs text-sky-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-200 text-sky-800 font-bold">⚛️</span>
            <span>Phát hiện ký tự/công thức hóa học hoặc KaTeX cần chuẩn hóa (như \text&#123;CO_2&#125;, O₂, thiếu $...)</span>
          </div>
          <button
            type="button"
            onClick={handleAutoFixCharacters}
            className="flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-sky-700 transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sửa lỗi ký tự</span>
          </button>
        </div>
      )}

      {/* Question Content Editor */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-gray-700">
            Nội dung câu hỏi:
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const tableSnippet = '\n\n| Nhiệt độ (°C) | [H2] (mol/L) | [I2] (mol/L) | [HI] (mol/L) | Kc |\n| :--- | :--- | :--- | :--- | :--- |\n| 25 | 0,0355 | 0,0388 | 0,9220 | 50 |\n| 340 | 0,0380 | 0,0455 | 0,3870 | 9,6 |\n';
                handleContentChange((question.content || '') + tableSnippet);
              }}
              className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer"
              title="Chèn bảng số liệu vào nội dung câu hỏi"
            >
              <Table className="h-3 w-3" />
              <span>+ Bảng số liệu</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleContentChange((question.content || '') + ' $x^2 + 1 = 0$ ');
              }}
              className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 transition flex items-center gap-1 cursor-pointer"
              title="Chèn công thức toán KaTeX"
            >
              <Sigma className="h-3 w-3" />
              <span>+ Công thức</span>
            </button>
          </div>
        </div>
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
              Xem trước câu hỏi:
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoCleanQuestion}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                title="Chuẩn hóa lại phương án A-B-C-D, làm sạch nhãn thừa và loại bỏ phương án rỗng"
              >
                <Sparkles className="h-3 w-3 text-amber-600" />
                <span>Chuẩn hóa A-B-C-D</span>
              </button>
              <button
                type="button"
                onClick={handleAutoFixCharacters}
                className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                title="Tự động kiểm tra và sửa lỗi ký tự, công thức hóa học (CO2, O2) và ký hiệu toán học"
              >
                <Sparkles className="h-3 w-3 text-sky-600" />
                <span>Sửa lỗi ký tự</span>
              </button>
              {(question.options?.length ?? 0) < 4 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm phương án</span>
              </button>
            )}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(question.options || []).map((opt, idx) => {
              const isCorrect = question.correctAnswer === opt.key;
              const hasFormula = hasFormulaSyntax(opt.content);

              return (
                <div
                  key={`${opt.key}-${idx}`}
                  className={`flex flex-col rounded-xl border p-2.5 transition ${
                    isCorrect
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* Clickable Badge to set Correct Answer */}
                    <button
                      type="button"
                      onClick={() => handleSetCorrectAnswer(opt.key)}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
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
                        className="text-gray-400 hover:text-rose-500 transition p-1 cursor-pointer"
                        title="Xóa phương án này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Inline Live Formula Preview for options */}
                  {(showPreview || hasFormula) && opt.content.trim() && (
                    <div className="mt-2 border-t border-gray-100/80 pt-1.5 pl-10 text-xs text-gray-800 flex items-center gap-1.5">
                      <span className="rounded bg-slate-100 px-1 py-0.2 text-[10px] font-bold text-slate-500">
                        Hiển thị
                      </span>
                      <div className="inline-block overflow-x-auto">
                        <MathView content={opt.content} />
                      </div>
                    </div>
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
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm ý</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {(question.subItems || []).map((item, idx) => (
              <div key={item.key} className="flex flex-col p-3 hover:bg-slate-50/50 transition">
                <div className="flex items-center gap-3">
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
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
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
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
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
                        className="text-gray-400 hover:text-rose-500 transition p-1 ml-1 cursor-pointer"
                        title="Xóa ý này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {(showPreview || hasFormulaSyntax(item.content)) && item.content.trim() && (
                  <div className="mt-2 border-t border-gray-100/80 pt-1.5 pl-6 text-xs text-gray-800 flex items-center gap-1.5">
                    <span className="rounded bg-slate-100 px-1 py-0.2 text-[10px] font-bold text-slate-500">
                      Hiển thị
                    </span>
                    <div className="inline-block overflow-x-auto">
                      <MathView content={item.content} />
                    </div>
                  </div>
                )}
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

        {showPreview && question.explanation && (
          <div className="mt-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Xem trước lời giải:
            </span>
            <MathView content={question.explanation} />
          </div>
        )}
      </div>
    </div>
  );
};
