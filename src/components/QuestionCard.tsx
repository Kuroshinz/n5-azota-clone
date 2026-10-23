'use client';

import React from 'react';
import { OptionKey, Question, StudentAnswerValue } from '../types/exam';
import { MathView } from './MathView';
import { Flag, CheckCircle, XCircle } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  selectedOption?: StudentAnswerValue;
  isFlagged?: boolean;
  onSelectOption?: (val: any) => void;
  onToggleFlag?: () => void;
  showAnswer?: boolean;
  readOnly?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedOption,
  isFlagged,
  onSelectOption,
  onToggleFlag,
  showAnswer = false,
  readOnly = false,
}) => {
  return (
    <div
      id={`question-${question.id}`}
      className="scroll-mt-20 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-sm font-bold text-indigo-700">
            Câu {question.id}
          </span>
          <span className="text-xs text-gray-500">({question.score} điểm)</span>
        </div>

        {onToggleFlag && !readOnly && (
          <button
            type="button"
            onClick={onToggleFlag}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
              isFlagged ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            <Flag className="h-3.5 w-3.5 fill-current" />
            <span>{isFlagged ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
          </button>
        )}
      </div>

      <div className="mb-4 text-base font-medium text-gray-800 leading-relaxed">
        <MathView content={question.content} />
      </div>

      {question.options && question.options.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {question.options.map(opt => {
            const isSelected = selectedOption === opt.key;
            const isCorrect = showAnswer && question.correctAnswer === opt.key;
            const isWrongSelected = showAnswer && isSelected && !isCorrect;

            let btnClass = 'border-gray-200 bg-gray-50/50 hover:border-indigo-300 hover:bg-indigo-50/30 text-gray-700';

            if (showAnswer) {
              if (isCorrect) {
                btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium';
              } else if (isWrongSelected) {
                btnClass = 'border-rose-400 bg-rose-50 text-rose-900 line-through';
              }
            } else if (isSelected) {
              btnClass = 'border-indigo-600 bg-indigo-50/90 text-indigo-900 font-semibold shadow-sm ring-1 ring-indigo-600';
            }

            return (
              <button
                key={opt.key}
                type="button"
                disabled={readOnly}
                onClick={() => onSelectOption?.(opt.key)}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${btnClass}`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    showAnswer && isCorrect
                      ? 'bg-emerald-600 text-white'
                      : showAnswer && isWrongSelected
                      ? 'bg-rose-600 text-white'
                      : isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700'
                  }`}
                >
                  {opt.key}
                </span>
                <div className="flex-1 text-sm pt-0.5">
                  <MathView content={opt.content} />
                </div>
                {showAnswer && isCorrect && <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />}
                {showAnswer && isWrongSelected && <XCircle className="h-5 w-5 text-rose-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {showAnswer && question.explanation && (
        <div className="mt-4 rounded-lg bg-amber-50/80 p-3.5 border border-amber-200 text-sm text-gray-800">
          <div className="font-semibold text-amber-800 mb-1">💡 Lời giải chi tiết:</div>
          <MathView content={question.explanation} />
        </div>
      )}
    </div>
  );
};
