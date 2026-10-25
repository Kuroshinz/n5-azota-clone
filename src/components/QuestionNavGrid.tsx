'use client';

import React from 'react';
import { Question, StudentAnswerValue } from '../types/exam';

interface QuestionNavGridProps {
  questions?: Question[];
  totalQuestions?: number;
  answers: Record<number, StudentAnswerValue>;
  flaggedQuestionIds: Set<number>;
  activeQuestionId?: number;
  onSelectQuestion: (questionId: number, displayNumber: number) => void;
}

export const QuestionNavGrid: React.FC<QuestionNavGridProps> = ({
  questions,
  totalQuestions,
  answers,
  flaggedQuestionIds,
  activeQuestionId,
  onSelectQuestion,
}) => {
  const count = questions ? questions.length : (totalQuestions ?? 0);

  const isQuestionAnswered = (val: StudentAnswerValue | undefined): boolean => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (typeof val === 'object') return Object.keys(val).length > 0;
    return false;
  };

  // If questions array is passed, use its items; otherwise fallback to 1..count IDs
  const items = questions
    ? questions.map((q, idx) => ({
        displayNumber: idx + 1,
        questionId: q.id,
        isAnswered: isQuestionAnswered(answers[q.id]),
        isFlagged: flaggedQuestionIds.has(q.id),
        isActive: activeQuestionId === q.id,
      }))
    : Array.from({ length: count }, (_, idx) => {
        const id = idx + 1;
        return {
          displayNumber: id,
          questionId: id,
          isAnswered: isQuestionAnswered(answers[id]),
          isFlagged: flaggedQuestionIds.has(id),
          isActive: activeQuestionId === id,
        };
      });

  const answeredCount = items.filter(item => item.isAnswered).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-gray-500">
        <span className="font-semibold text-gray-800">Bảng câu hỏi ({answeredCount}/{count})</span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-h-52 sm:max-h-64 overflow-y-auto p-1">
        {items.map(item => {
          let bg = 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
          if (item.isAnswered) {
            bg = 'bg-indigo-600 text-white border-indigo-700 shadow-sm';
          }
          if (item.isFlagged) {
            bg = item.isAnswered
              ? 'bg-amber-500 text-white border-amber-600'
              : 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
          }

          return (
            <button
              key={item.displayNumber}
              type="button"
              onClick={() => onSelectQuestion(item.questionId, item.displayNumber)}
              className={`relative flex min-h-[40px] h-10 w-full items-center justify-center rounded-xl border text-xs sm:text-sm font-bold transition touch-manipulation cursor-pointer active:scale-95 ${bg} ${
                item.isActive ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
              }`}
            >
              {item.displayNumber}
              {item.isFlagged && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-[11px] text-gray-600">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-indigo-600" />
          <span>Đã làm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-gray-200" />
          <span>Chưa làm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-400" />
          <span>Đánh dấu</span>
        </div>
      </div>
    </div>
  );
};
