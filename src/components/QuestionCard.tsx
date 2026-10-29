'use client';

import React, { useState, useRef } from 'react';
import { Question, StudentAnswerValue } from '../types/exam';
import { MathView } from './MathView';
import { Flag, CheckCircle, XCircle, Check, X, Volume2, AlertCircle } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  displayNumber?: number;
  selectedOption?: StudentAnswerValue;
  isFlagged?: boolean;
  onSelectOption?: (val: any) => void;
  onToggleFlag?: () => void;
  showAnswer?: boolean;
  readOnly?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  displayNumber,
  selectedOption,
  isFlagged,
  onSelectOption,
  onToggleFlag,
  showAnswer = false,
  readOnly = false,
}) => {
  const qType = question.type || 'multiple_choice';
  const displayNum = displayNumber ?? question.id;
  const [playCount, setPlayCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playLimit = question.audioPlayLimit && question.audioPlayLimit > 0 ? question.audioPlayLimit : null;
  const isAudioLocked = playLimit !== null && playCount >= playLimit;

  const handleAudioPlay = () => {
    if (playLimit !== null && playCount >= playLimit) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }
  };

  const handleAudioEnded = () => {
    if (playLimit !== null) {
      setPlayCount(prev => prev + 1);
    }
  };


  const typeBadgeLabel =
    qType === 'true_false'
      ? 'Đúng / Sai'
      : qType === 'short_answer'
      ? 'Trả lời ngắn'
      : 'Trắc nghiệm';

  return (
    <div
      id={`question-${question.id}`}
      data-display-num={displayNum}
      className="scroll-mt-20 rounded-xl border border-gray-200 bg-white p-3.5 sm:p-5 shadow-sm transition hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-sm font-bold text-indigo-700">
            Câu {displayNum}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {typeBadgeLabel}
          </span>
          <span className="text-xs text-gray-500">({question.score} điểm)</span>
        </div>

        {/* Action: Flag */}
        {!readOnly && onToggleFlag && (
          <button
            type="button"
            onClick={onToggleFlag}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              isFlagged ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            <Flag className="h-3.5 w-3.5 fill-current" />
            <span>{isFlagged ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
          </button>
        )}
      </div>


      {/* Audio / Listening Track */}
      {question.audioUrl && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/70 p-3 sm:p-3.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                <Volume2 className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-blue-950 block">File nghe bài thi (Listening Comprehension)</span>
                <span className="text-[11px] text-blue-700">Nghe kỹ đoạn băng để trả lời câu hỏi</span>
              </div>
            </div>

            {playLimit !== null ? (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                isAudioLocked
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-white text-blue-800 border-blue-200 shadow-xs'
              }`}>
                {isAudioLocked ? 'Đã hết lượt nghe' : `Lượt nghe: ${playCount}/${playLimit}`}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-blue-600 bg-white/80 px-2 py-0.5 rounded-md border border-blue-200">
                Không giới hạn lượt nghe
              </span>
            )}
          </div>

          <div onContextMenu={e => e.preventDefault()} className="select-none">
            {isAudioLocked ? (
              <div className="rounded-lg bg-white/90 p-2 text-center text-xs text-rose-600 font-semibold border border-rose-200 flex items-center justify-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>Bạn đã sử dụng hết số lần nghe cho câu hỏi này ({playLimit} lần).</span>
              </div>
            ) : (
              <audio
                ref={audioRef}
                controls
                src={question.audioUrl}
                onPlay={handleAudioPlay}
                onEnded={handleAudioEnded}
                controlsList="nodownload noplaybackrate"
                className="w-full h-9 rounded"
              />
            )}
          </div>
        </div>
      )}
      {/* Content */}
      <div className="mb-4 text-base font-medium text-gray-800 leading-relaxed">
        <MathView content={question.content} />
      </div>

      {/* Mode 1: Multiple Choice */}
      {qType === 'multiple_choice' && question.options && question.options.length > 0 && (
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
                className={`flex items-start gap-3 rounded-xl border p-3 sm:p-3.5 text-left transition min-h-[44px] active:scale-[0.99] touch-manipulation cursor-pointer ${btnClass}`}
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

      {/* Mode 2: True / False */}
      {qType === 'true_false' && question.subItems && question.subItems.length > 0 && (
        <div className="space-y-2.5">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="hidden sm:grid grid-cols-12 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 border-b border-gray-200">
              <span className="col-span-8 sm:col-span-9">Mệnh đề khẳng định</span>
              <span className="col-span-4 sm:col-span-3 text-center">Lựa chọn của bạn</span>
            </div>

            <div className="divide-y divide-gray-100">
              {question.subItems.map(item => {
                const tfAnswers = (typeof selectedOption === 'object' && selectedOption !== null)
                  ? (selectedOption as Record<string, boolean>)
                  : {};
                const currentVal = tfAnswers[item.key];

                return (
                  <div key={item.key} className="flex flex-col sm:grid sm:grid-cols-12 sm:items-center px-3.5 sm:px-4 py-3 gap-2.5 sm:gap-2">
                    <div className="sm:col-span-8 md:col-span-9 flex items-start gap-2.5 text-sm text-gray-800">
                      <span className="font-bold text-indigo-700 shrink-0 text-sm">{item.key})</span>
                      <div className="flex-1 break-words">
                        <MathView content={item.content} />
                      </div>
                    </div>

                    <div className="sm:col-span-4 md:col-span-3 flex items-center justify-end sm:justify-center gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                      <span className="text-[11px] font-medium text-gray-400 sm:hidden mr-auto">Chọn:</span>
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => {
                          const next = { ...tfAnswers, [item.key]: true };
                          onSelectOption?.(next);
                        }}
                        className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 touch-manipulation cursor-pointer ${
                          currentVal === true
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Đúng</span>
                      </button>

                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => {
                          const next = { ...tfAnswers, [item.key]: false };
                          onSelectOption?.(next);
                        }}
                        className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 touch-manipulation cursor-pointer ${
                          currentVal === false
                            ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Sai</span>
                      </button>

                      {showAnswer && item.correctAnswer !== undefined && (
                        <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded ${item.correctAnswer ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'}`}>
                          ({item.correctAnswer ? 'Đ' : 'S'})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Short Answer */}
      {qType === 'short_answer' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              disabled={readOnly}
              value={typeof selectedOption === 'string' ? selectedOption : ''}
              onChange={e => onSelectOption?.(e.target.value)}
              placeholder="Nhập kết quả số hoặc phân số (ví dụ: 12.5 hoặc -3/4)..."
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          {showAnswer && question.acceptedAnswers && (
            <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Đáp số chính xác: <strong>{question.acceptedAnswers.join(' hoặc ')}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      {showAnswer && question.explanation && (
        <div className="mt-4 rounded-lg bg-amber-50/80 p-3.5 border border-amber-200 text-sm text-gray-800">
          <div className="font-semibold text-amber-800 mb-1">💡 Lời giải chi tiết:</div>
          <MathView content={question.explanation} />
        </div>
      )}
    </div>
  );
};
