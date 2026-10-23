'use client';

import React from 'react';
import { OptionKey } from '../types/exam';

interface QuestionNavGridProps {
  totalQuestions: number;
  answers: Record<number, OptionKey>;
  flaggedQuestionIds: Set<number>;
  activeQuestionId?: number;
  onSelectQuestion: (id: number) => void;
}

export const QuestionNavGrid: React.FC<QuestionNavGridProps> = ({
  totalQuestions,
  answers,
  flaggedQuestionIds,
  activeQuestionId,
  onSelectQuestion,
}) => {
  const qIds = Array.from({ length: totalQuestions }, (_, i) => i + 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-gray-500">
        <span className="font-semibold text-gray-800">Bảng câu hỏi ({Object.keys(answers).length}/{totalQuestions})</span>
      </div>

      <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
        {qIds.map(id => {
          const isAnswered = answers[id] !== undefined;
          const isFlagged = flaggedQuestionIds.has(id);
          const isActive = activeQuestionId === id;

          let bg = 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
          if (isAnswered) {
            bg = 'bg-indigo-600 text-white border-indigo-700 shadow-sm';
          }
          if (isFlagged) {
            bg = isAnswered
              ? 'bg-amber-500 text-white border-amber-600'
              : 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
          }

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectQuestion(id)}
              className={`relative flex h-9 w-full items-center justify-center rounded-lg border text-xs font-bold transition ${bg} ${
                isActive ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
              }`}
            >
              {id}
              {isFlagged && (
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
