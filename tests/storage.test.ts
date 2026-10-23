import { describe, it, expect } from 'vitest';
import {
  saveExam,
  getExam,
  listExams,
  saveDraft,
  getDraft,
  clearDraft,
  calculateScore,
  saveSubmission,
  getSubmissions,
  getSubmission,
} from '../src/storage/examStorage';
import { Exam, Submission } from '../src/types/exam';

describe('Exam Storage & Scoring Service', () => {
  const sampleExam: Exam = {
    id: 'exam-test-1',
    title: 'Đề kiểm tra thử',
    durationMinutes: 10,
    totalQuestions: 3,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 1,
        type: 'multiple_choice',
        rawText: 'Câu 1...',
        content: '1 + 1 = ?',
        options: [
          { key: 'A', content: '1' },
          { key: 'B', content: '2' },
          { key: 'C', content: '3' },
          { key: 'D', content: '4' },
        ],
        correctAnswer: 'B',
        score: 1.0,
      },
      {
        id: 2,
        type: 'true_false',
        rawText: 'Câu 2...',
        content: 'Xét tính đúng sai của các khẳng định sau:',
        options: [],
        subItems: [
          { key: 'a', content: '2 là số chẵn', correctAnswer: true },
          { key: 'b', content: '3 là số chẵn', correctAnswer: false },
          { key: 'c', content: '5 là số nguyên tố', correctAnswer: true },
          { key: 'd', content: '9 là số nguyên tố', correctAnswer: false },
        ],
        score: 1.0,
      },
      {
        id: 3,
        type: 'short_answer',
        rawText: 'Câu 3...',
        content: 'Nghiệm của phương trình 2x = 5 là:',
        options: [],
        acceptedAnswers: ['2.5', '5/2'],
        score: 1.0,
      },
    ],
  };

  it('saves and retrieves exams', () => {
    saveExam(sampleExam);
    const retrieved = getExam('exam-test-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Đề kiểm tra thử');
  });

  it('saves and retrieves drafts with multiple answer types', () => {
    saveDraft('exam-test-1', {
      1: 'B',
      2: { a: true, b: false, c: true, d: false },
      3: '2.5',
    });
    const draft = getDraft('exam-test-1');
    expect(draft[1]).toBe('B');
    expect(draft[2]).toEqual({ a: true, b: false, c: true, d: false });
    expect(draft[3]).toBe('2.5');

    clearDraft('exam-test-1');
    expect(getDraft('exam-test-1')).toEqual({});
  });

  it('scores True/False questions according to GDPT 2018 grading scale', () => {
    // 4/4 correct -> 1.0 score
    const res4 = calculateScore(sampleExam, {
      2: { a: true, b: false, c: true, d: false },
    });
    expect(res4.score).toBe(1.0);

    // 3/4 correct -> 0.5 score
    const res3 = calculateScore(sampleExam, {
      2: { a: true, b: false, c: true, d: true }, // d is wrong
    });
    expect(res3.score).toBe(0.5);

    // 2/4 correct -> 0.25 score
    const res2 = calculateScore(sampleExam, {
      2: { a: true, b: true, c: true, d: true }, // b and d are wrong
    });
    expect(res2.score).toBe(0.25);

    // 1/4 correct -> 0.1 score
    const res1 = calculateScore(sampleExam, {
      2: { a: false, b: true, c: true, d: true }, // only c is correct
    });
    expect(res1.score).toBe(0.1);

    // 0/4 correct -> 0.0 score
    const res0 = calculateScore(sampleExam, {
      2: { a: false, b: true, c: false, d: true },
    });
    expect(res0.score).toBe(0.0);
  });

  it('scores Short Answer questions with comma/dot and whitespace tolerance', () => {
    // Student inputs comma '2,5' instead of '2.5'
    const resComma = calculateScore(sampleExam, {
      3: '2,5',
    });
    expect(resComma.score).toBe(1.0);

    // Student inputs with extra spaces
    const resSpaces = calculateScore(sampleExam, {
      3: '  2.5  ',
    });
    expect(resSpaces.score).toBe(1.0);

    // Alternate accepted answer '5/2'
    const resAlt = calculateScore(sampleExam, {
      3: '5/2',
    });
    expect(resAlt.score).toBe(1.0);

    // Wrong answer '4'
    const resWrong = calculateScore(sampleExam, {
      3: '4',
    });
    expect(resWrong.score).toBe(0.0);
  });
});
