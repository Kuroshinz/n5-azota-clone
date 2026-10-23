import { describe, it, expect } from 'vitest';
import { Exam, Question, Option, Submission } from '../src/types/exam';
import { ProctoringReport, ProctoringEvent } from '../src/types/proctoring';

describe('Core Domain Types', () => {
  it('instantiates valid Exam, Question, and Option structures', () => {
    const options: Option[] = [
      { key: 'A', content: '$x = 1$' },
      { key: 'B', content: '$x = 2$' },
      { key: 'C', content: '$x = 3$' },
      { key: 'D', content: '$x = 4$' },
    ];

    const question: Question = {
      id: 1,
      rawText: 'Câu 1: Giải phương trình x - 2 = 0\nA. x = 1\nB. x = 2\nC. x = 3\nD. x = 4',
      content: 'Giải phương trình $x - 2 = 0$',
      options,
      correctAnswer: 'B',
      explanation: 'Ta có $x = 2$',
      score: 1.0,
    };

    const exam: Exam = {
      id: 'exam-123',
      title: 'Đề thi Toán giữa kỳ 1',
      durationMinutes: 45,
      totalQuestions: 1,
      questions: [question],
      createdAt: '2026-10-23T00:00:00.000Z',
    };

    expect(exam.id).toBe('exam-123');
    expect(exam.title).toBe('Đề thi Toán giữa kỳ 1');
    expect(exam.durationMinutes).toBe(45);
    expect(exam.totalQuestions).toBe(1);
    expect(exam.questions).toHaveLength(1);
    expect(exam.questions[0].id).toBe(1);
    expect(exam.questions[0].options).toHaveLength(4);
    expect(exam.questions[0].correctAnswer).toBe('B');
    expect(exam.questions[0].score).toBe(1.0);
  });

  it('instantiates valid ProctoringReport and ProctoringEvent structures', () => {
    const events: ProctoringEvent[] = [
      {
        type: 'out_screen',
        timestamp: 1729700000000,
        details: 'User switched window',
      },
      {
        type: 'fullscreen_exit',
        timestamp: 1729700010000,
      },
      {
        type: 'blur',
        timestamp: 1729700020000,
      },
      {
        type: 'visibility_hidden',
        timestamp: 1729700030000,
      },
      {
        type: 'inactivity',
        timestamp: 1729700040000,
      },
    ];

    const report: ProctoringReport = {
      outScreenCount: 3,
      fullscreenExitCount: 1,
      totalOutDurationSeconds: 15,
      events,
    };

    expect(report.outScreenCount).toBe(3);
    expect(report.fullscreenExitCount).toBe(1);
    expect(report.totalOutDurationSeconds).toBe(15);
    expect(report.events).toHaveLength(5);
    expect(report.events[0].type).toBe('out_screen');
    expect(report.events[0].details).toBe('User switched window');
    expect(report.events[1].details).toBeUndefined();
  });

  it('instantiates valid Submission structure connecting Exam and ProctoringReport', () => {
    const report: ProctoringReport = {
      outScreenCount: 0,
      fullscreenExitCount: 0,
      totalOutDurationSeconds: 0,
      events: [],
    };

    const submission: Submission = {
      id: 'sub-456',
      examId: 'exam-123',
      studentName: 'Nguyễn Văn A',
      answers: {
        1: 'B',
      },
      score: 1.0,
      totalScore: 1.0,
      submittedAt: '2026-10-23T00:30:00.000Z',
      proctoringReport: report,
    };

    expect(submission.id).toBe('sub-456');
    expect(submission.examId).toBe('exam-123');
    expect(submission.studentName).toBe('Nguyễn Văn A');
    expect(submission.answers[1]).toBe('B');
    expect(submission.score).toBe(1.0);
    expect(submission.totalScore).toBe(1.0);
    expect(submission.proctoringReport.events).toEqual([]);
  });
});
