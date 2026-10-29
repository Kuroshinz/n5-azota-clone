import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { examService } from '../src/server/examService';
import { authService } from '../src/server/authService';
import { POST as duplicateExamHandler } from '../src/app/api/exams/[id]/route';
import { POST as submitHandler } from '../src/app/api/submissions/route';
import { Exam } from '../src/types/exam';

describe('Enhanced Exam Features: Duplicate Exam & Test Run Preview', () => {
  const teacherUserId = 'teacher-unit-test-1';
  let teacherToken = '';
  const testExamId = 'exam-dup-preview-test-1';

  beforeEach(async () => {
    teacherToken = authService.createToken({
      userId: teacherUserId,
      role: 'TEACHER',
      fullName: 'Thầy Giáo Viên Test',
    });

    // Save a sample exam
    const sampleExam: Exam = {
      id: testExamId,
      title: 'Đề thi Thử nghiệm N5Exam 2026',
      durationMinutes: 45,
      totalQuestions: 2,
      authorId: teacherUserId,
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: 1,
          type: 'multiple_choice',
          rawText: 'Câu 1...',
          content: 'Giá trị của 2 + 2 là:',
          options: [
            { key: 'A', content: '4' },
            { key: 'B', content: '5' },
          ],
          correctAnswer: 'A',
          score: 5,
        },
        {
          id: 2,
          type: 'multiple_choice',
          rawText: 'Câu 2...',
          content: 'Thủ đô của Việt Nam là:',
          options: [
            { key: 'A', content: 'Hà Nội' },
            { key: 'B', content: 'Huế' },
          ],
          correctAnswer: 'A',
          score: 5,
        },
      ],
    };
    await examService.saveExam(sampleExam);
  });

  it('should duplicate an exam via POST /api/exams/[id]', async () => {
    const req = new NextRequest(`http://localhost:3000/api/exams/${testExamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ action: 'clone' }),
    });

    const res = await duplicateExamHandler(req, { params: { id: testExamId } });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.exam).toBeDefined();
    expect(data.exam.id).not.toBe(testExamId);
    expect(data.exam.title).toContain('Đề thi Thử nghiệm N5Exam 2026 (Bản sao)');
    expect(data.exam.questions.length).toBe(2);
    expect(data.exam.submissionCount).toBe(0);
    expect(data.exam.authorId).toBe(teacherUserId);

    // Verify it exists in persistent storage
    const fetched = await examService.getExam(data.exam.id);
    expect(fetched).toBeDefined();
    expect(fetched?.title).toBe(data.exam.title);
  });

  it('should process test-run submission without persisting to official gradebook', async () => {
    const initialSubs = await examService.getSubmissions(testExamId);
    const initialCount = initialSubs.length;

    const req = new NextRequest('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        examId: testExamId,
        answers: { 1: 'A', 2: 'A' },
        isPreview: true,
      }),
    });

    const res = await submitHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.submission).toBeDefined();
    expect(data.submission.isPreview).toBe(true);
    expect(data.submission.score).toBe(10);
    expect(data.submission.totalScore).toBe(10);
    expect(data.submission.studentName).toContain('Giáo viên làm thử');

    // Crucial check: verify that official submissions count in DB was NOT incremented
    const afterSubs = await examService.getSubmissions(testExamId);
    expect(afterSubs.length).toBe(initialCount);
  });
  it('supports inserting a new question between existing questions and sequentially reindexing', () => {
    const questions = [
      { id: 1, rawText: 'Câu 1: Nội dung 1', content: 'Q1' },
      { id: 2, rawText: 'Câu 2: Nội dung 2', content: 'Q2' },
    ];

    // Insert between Q1 and Q2 at index 1
    const insertIndex = 1;
    const newQ = { id: 999, rawText: `Câu ${insertIndex + 1}: `, content: 'Inserted Question' };

    const next = [...questions];
    next.splice(insertIndex, 0, newQ);

    const reindexed = next.map((q, idx) => ({
      ...q,
      id: idx + 1,
      rawText: q.rawText ? q.rawText.replace(/^(?:Câu|Bài|Question)\s*\d+/i, `Câu ${idx + 1}`) : `Câu ${idx + 1}: `,
    }));

    expect(reindexed).toHaveLength(3);
    expect(reindexed[0].id).toBe(1);
    expect(reindexed[0].content).toBe('Q1');
    expect(reindexed[1].id).toBe(2);
    expect(reindexed[1].content).toBe('Inserted Question');
    expect(reindexed[1].rawText).toContain('Câu 2');
    expect(reindexed[2].id).toBe(3);
    expect(reindexed[2].content).toBe('Q2');
    expect(reindexed[2].rawText).toContain('Câu 3');
  });
  it('supports drag-and-drop reordering and quick move with automatic re-indexing', () => {
    const questions = [
      { id: 1, rawText: 'Câu 1: Câu đầu tiên', content: 'Q1' },
      { id: 2, rawText: 'Câu 2: Câu thứ hai', content: 'Q2' },
      { id: 3, rawText: 'Câu 3: Câu thứ ba', content: 'Q3' },
    ];

    // Simulate Drag Q3 (index 2) to the top (index 0)
    const fromIndex = 2;
    const toIndex = 0;
    const reordered = [...questions];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const reindexed = reordered.map((q, idx) => ({
      ...q,
      id: idx + 1,
      rawText: q.rawText.replace(/^(?:Câu|Bài|Question)\s*\d+/i, 'Câu ' + (idx + 1)),
    }));

    expect(reindexed).toHaveLength(3);
    expect(reindexed[0].content).toBe('Q3');
    expect(reindexed[0].id).toBe(1);
    expect(reindexed[0].rawText).toContain('Câu 1');

    expect(reindexed[1].content).toBe('Q1');
    expect(reindexed[1].id).toBe(2);
    expect(reindexed[1].rawText).toContain('Câu 2');

    expect(reindexed[2].content).toBe('Q2');
    expect(reindexed[2].id).toBe(3);
    expect(reindexed[2].rawText).toContain('Câu 3');
  });
});
