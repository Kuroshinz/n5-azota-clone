import { describe, it, expect } from 'vitest';
import { Exam, Question, Option, Submission } from '../src/types/exam';
import { ProctoringReport, ProctoringEvent } from '../src/types/proctoring';

describe('Core Domain Types', () => {
  it('instantiates valid Multiple Choice Question', () => {
    const options: Option[] = [
      { key: 'A', content: '$x = 1$' },
      { key: 'B', content: '$x = 2$' },
      { key: 'C', content: '$x = 3$' },
      { key: 'D', content: '$x = 4$' },
    ];

    const question: Question = {
      id: 1,
      type: 'multiple_choice',
      rawText: 'Câu 1: Giải phương trình x - 2 = 0\nA. x = 1\nB. x = 2\nC. x = 3\nD. x = 4',
      content: 'Giải phương trình $x - 2 = 0$',
      options,
      correctAnswer: 'B',
      explanation: 'Ta có $x = 2$',
      score: 1.0,
    };

    expect(question.type).toBe('multiple_choice');
    expect(question.options).toHaveLength(4);
    expect(question.correctAnswer).toBe('B');
  });

  it('instantiates valid True/False Question with 4 sub-items', () => {
    const question: Question = {
      id: 2,
      type: 'true_false',
      rawText: 'Câu 2: Cho hàm số y = f(x)...',
      content: 'Cho hàm số $y = x^3 - 3x$. Các mệnh đề sau đúng hay sai?',
      score: 1.0,
      options: [],
      subItems: [
        { key: 'a', content: 'Hàm số đồng biến trên $(1; +\\infty)$', correctAnswer: true },
        { key: 'b', content: 'Hàm số nghịch biến trên $(-1; 1)$', correctAnswer: true },
        { key: 'c', content: 'Giá trị cực đại là $y = -2$', correctAnswer: false },
        { key: 'd', content: 'Đồ thị cắt trục hoành tại 3 điểm phân biệt', correctAnswer: true },
      ],
    };

    expect(question.type).toBe('true_false');
    expect(question.subItems).toHaveLength(4);
    expect(question.subItems?.[0].correctAnswer).toBe(true);
    expect(question.subItems?.[2].correctAnswer).toBe(false);
  });

  it('instantiates valid Short Answer Question with accepted answers', () => {
    const question: Question = {
      id: 3,
      type: 'short_answer',
      rawText: 'Câu 3: Tính đạo hàm tại x = 2...',
      content: 'Cho hàm số $f(x) = x^2 + 3x$. Tính $f\'(2)$.',
      score: 0.5,
      options: [],
      acceptedAnswers: ['7', '7.0'],
    };

    expect(question.type).toBe('short_answer');
    expect(question.acceptedAnswers).toContain('7');
  });

  it('instantiates Submission with diverse student answer types', () => {
    const submission: Submission = {
      id: 'sub-789',
      examId: 'exam-123',
      studentName: 'Nguyễn Văn A',
      answers: {
        1: 'B',
        2: { a: true, b: true, c: false, d: true },
        3: '7',
      },
      score: 2.5,
      totalScore: 2.5,
      submittedAt: new Date().toISOString(),
      proctoringReport: {
        outScreenCount: 0,
        fullscreenExitCount: 0,
        totalOutDurationSeconds: 0,
        events: [],
      },
    };

    expect(submission.answers[1]).toBe('B');
    expect(submission.answers[2]).toEqual({ a: true, b: true, c: false, d: true });
    expect(submission.answers[3]).toBe('7');
  });
});
