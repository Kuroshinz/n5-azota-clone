import { describe, it, expect, beforeEach } from 'vitest';
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
    totalQuestions: 2,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 1,
        rawText: 'Câu 1...',
        content: '1 + 1 = ?',
        options: [
          { key: 'A', content: '1' },
          { key: 'B', content: '2' },
          { key: 'C', content: '3' },
          { key: 'D', content: '4' },
        ],
        correctAnswer: 'B',
        score: 5.0,
      },
      {
        id: 2,
        rawText: 'Câu 2...',
        content: '2 * 3 = ?',
        options: [
          { key: 'A', content: '5' },
          { key: 'B', content: '6' },
          { key: 'C', content: '7' },
          { key: 'D', content: '8' },
        ],
        correctAnswer: 'B',
        score: 5.0,
      },
    ],
  };

  beforeEach(() => {
    // clear in-memory store
  });

  it('saves and retrieves exams', () => {
    saveExam(sampleExam);
    const retrieved = getExam('exam-test-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Đề kiểm tra thử');

    const all = listExams();
    expect(all.some(e => e.id === 'exam-test-1')).toBe(true);
  });

  it('saves, retrieves, and clears student exam answer drafts', () => {
    saveDraft('exam-test-1', { 1: 'B', 2: 'A' });
    const draft = getDraft('exam-test-1');
    expect(draft[1]).toBe('B');
    expect(draft[2]).toBe('A');

    clearDraft('exam-test-1');
    const emptyDraft = getDraft('exam-test-1');
    expect(emptyDraft).toEqual({});
  });

  it('calculates score correctly based on correct answers', () => {
    // Both correct: 5 + 5 = 10
    const perfectResult = calculateScore(sampleExam, { 1: 'B', 2: 'B' });
    expect(perfectResult.score).toBe(10.0);
    expect(perfectResult.totalScore).toBe(10.0);
    expect(perfectResult.correctCount).toBe(2);

    // One correct: 5
    const partialResult = calculateScore(sampleExam, { 1: 'B', 2: 'C' });
    expect(partialResult.score).toBe(5.0);
    expect(partialResult.correctCount).toBe(1);

    // Zero correct: 0
    const zeroResult = calculateScore(sampleExam, { 1: 'A', 2: 'A' });
    expect(zeroResult.score).toBe(0.0);
    expect(zeroResult.correctCount).toBe(0);
  });

  it('saves and retrieves student submissions', () => {
    const sub: Submission = {
      id: 'sub-test-1',
      examId: 'exam-test-1',
      studentName: 'Trần Văn B',
      answers: { 1: 'B', 2: 'B' },
      score: 10,
      totalScore: 10,
      submittedAt: new Date().toISOString(),
      proctoringReport: {
        outScreenCount: 0,
        fullscreenExitCount: 0,
        totalOutDurationSeconds: 0,
        events: [],
      },
    };

    saveSubmission(sub);
    const retrieved = getSubmission('sub-test-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.studentName).toBe('Trần Văn B');

    const list = getSubmissions('exam-test-1');
    expect(list.some(s => s.id === 'sub-test-1')).toBe(true);
  });
});
