import { describe, it, expect } from 'vitest';
import { examService } from '../src/server/examService';

describe('Server Exam Service & API Logic', () => {
  const sampleExamText = `
Câu 1: Thủ đô của Việt Nam là gì?
A. Hà Nội
B. Huế
C. Đà Nẵng
D. Cần Thơ
Đáp án: A

Câu 2: Số nguyên tố chẵn duy nhất là?
A. 0
B. 1
C. 2
D. 4
Đáp án: C
  `.trim();

  it('creates an exam from raw text with metadata and saves it', () => {
    const exam = examService.createExamFromText(sampleExamText, {
      title: 'Đề kiểm tra địa lý & toán',
      durationMinutes: 20,
    });

    expect(exam.id).toBeDefined();
    expect(exam.title).toBe('Đề kiểm tra địa lý & toán');
    expect(exam.durationMinutes).toBe(20);
    expect(exam.totalQuestions).toBe(2);
    expect(exam.questions[0].correctAnswer).toBe('A');
    expect(exam.questions[1].correctAnswer).toBe('C');

    const found = examService.getExam(exam.id);
    expect(found).toEqual(exam);
  });

  it('handles student submission, scoring, and proctoring telemetry', () => {
    const exam = examService.createExamFromText(sampleExamText, {
      title: 'Đề thi trắc nghiệm',
      durationMinutes: 15,
    });

    const submission = examService.submitExam({
      examId: exam.id,
      studentName: 'Lê Thị Mai',
      answers: {
        1: 'A', // correct (5 điểm)
        2: 'D', // wrong
      },
      proctoringReport: {
        outScreenCount: 2,
        fullscreenExitCount: 1,
        totalOutDurationSeconds: 12,
        events: [
          {
            type: 'out_screen',
            timestamp: Date.now(),
            details: 'Tab switch',
          },
        ],
      },
    });

    expect(submission.id).toBeDefined();
    expect(submission.examId).toBe(exam.id);
    expect(submission.studentName).toBe('Lê Thị Mai');
    expect(submission.score).toBe(5.0);
    expect(submission.totalScore).toBe(10.0);
    expect(submission.proctoringReport.outScreenCount).toBe(2);

    const retrieved = examService.getSubmission(submission.id);
    expect(retrieved?.id).toBe(submission.id);

    const list = examService.getSubmissions(exam.id);
    expect(list.some(s => s.id === submission.id)).toBe(true);
  });
});
