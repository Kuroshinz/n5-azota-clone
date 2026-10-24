import { describe, it, expect } from 'vitest';
import {
  validateExamAccess,
  shuffleExamQuestions,
} from '../src/utils/examSettings';
import { ExamSettings, DEFAULT_EXAM_SETTINGS, Question } from '../src/types/exam';

describe('Exam Settings Utilities', () => {
  describe('DEFAULT_EXAM_SETTINGS', () => {
    it('defaults to practice mode with proctoring disabled', () => {
      expect(DEFAULT_EXAM_SETTINGS.enableProctoring).toBe(false);
      expect(DEFAULT_EXAM_SETTINGS.maxViolations).toBe(3);
      expect(DEFAULT_EXAM_SETTINGS.showResultAfterSubmit).toBe('score_and_answers');
      expect(DEFAULT_EXAM_SETTINGS.shuffleQuestions).toBe(false);
      expect(DEFAULT_EXAM_SETTINGS.shuffleOptions).toBe(false);
    });
  });

  describe('validateExamAccess', () => {
    it('allows access when no restrictions are set', () => {
      const res = validateExamAccess(DEFAULT_EXAM_SETTINGS);
      expect(res.allowed).toBe(true);
      expect(res.reason).toBeUndefined();
    });

    it('requires correct password when password is set', () => {
      const settings: ExamSettings = {
        ...DEFAULT_EXAM_SETTINGS,
        password: 'secret123',
      };

      expect(validateExamAccess(settings, undefined).allowed).toBe(false);
      expect(validateExamAccess(settings, undefined).reason).toBe('invalid_password');

      expect(validateExamAccess(settings, 'wrong').allowed).toBe(false);
      expect(validateExamAccess(settings, 'wrong').reason).toBe('invalid_password');

      expect(validateExamAccess(settings, 'secret123').allowed).toBe(true);
    });

    it('validates startTime and endTime bounds', () => {
      const now = new Date('2026-10-24T10:00:00Z');
      const settingsNotStarted: ExamSettings = {
        ...DEFAULT_EXAM_SETTINGS,
        startTime: '2026-10-24T10:30:00Z',
      };

      const resNotStarted = validateExamAccess(settingsNotStarted, undefined, now);
      expect(resNotStarted.allowed).toBe(false);
      expect(resNotStarted.reason).toBe('not_started');

      const settingsEnded: ExamSettings = {
        ...DEFAULT_EXAM_SETTINGS,
        endTime: '2026-10-24T09:30:00Z',
      };

      const resEnded = validateExamAccess(settingsEnded, undefined, now);
      expect(resEnded.allowed).toBe(false);
      expect(resEnded.reason).toBe('ended');

      const settingsValidTime: ExamSettings = {
        ...DEFAULT_EXAM_SETTINGS,
        startTime: '2026-10-24T09:00:00Z',
        endTime: '2026-10-24T11:00:00Z',
      };

      const resValid = validateExamAccess(settingsValidTime, undefined, now);
      expect(resValid.allowed).toBe(true);
    });
  });

  describe('shuffleExamQuestions', () => {
    const mockQuestions: Question[] = [
      {
        id: 1,
        type: 'multiple_choice',
        content: 'Câu 1: 1 + 1 = ?',
        rawText: 'Câu 1: 1 + 1 = ?',
        score: 0.25,
        options: [
          { key: 'A', content: '2' },
          { key: 'B', content: '3' },
          { key: 'C', content: '4' },
          { key: 'D', content: '5' },
        ],
        correctAnswer: 'A',
      },
      {
        id: 2,
        type: 'true_false',
        content: 'Câu 2: Xét tính đúng sai',
        rawText: 'Câu 2: Xét tính đúng sai',
        score: 1.0,
        options: [],
        subItems: [
          { key: 'a', content: 'Ý 1', correctAnswer: true },
          { key: 'b', content: 'Ý 2', correctAnswer: false },
        ],
      },
      {
        id: 3,
        type: 'short_answer',
        content: 'Câu 3: Nghiệm của x + 2 = 5',
        rawText: 'Câu 3: Nghiệm của x + 2 = 5',
        score: 0.5,
        options: [],
        acceptedAnswers: ['3'],
      },
    ];

    it('returns exact questions in original order when shuffling is disabled', () => {
      const result = shuffleExamQuestions(mockQuestions, false, false);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
      expect(result[0].options[0].content).toBe('2');
    });

    it('preserves all question contents and IDs when question shuffling is enabled', () => {
      const result = shuffleExamQuestions(mockQuestions, true, false);
      expect(result).toHaveLength(3);
      const ids = result.map((q) => q.id).sort();
      expect(ids).toEqual([1, 2, 3]);

      // All original options are preserved
      const q1 = result.find((q) => q.id === 1);
      expect(q1?.options).toHaveLength(4);
      expect(q1?.correctAnswer).toBe('A');
    });

    it('shuffles multiple-choice options when option shuffling is enabled', () => {
      const result = shuffleExamQuestions(mockQuestions, false, true);
      const q1 = result.find((q) => q.id === 1)!;
      expect(q1.options).toHaveLength(4);
      const contents = q1.options.map((o) => o.content).sort();
      expect(contents).toEqual(['2', '3', '4', '5']);
    });
  });
});
