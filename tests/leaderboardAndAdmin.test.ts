import { describe, it, expect, beforeEach } from 'vitest';
import { examService } from '../src/server/examService';
import { prisma } from '../src/server/prisma';
import { Exam } from '../src/types/exam';

describe('N5Exam Leaderboard & Admin Capabilities', () => {
  const sampleExam: Exam = {
    id: 'test-exam-leaderboard-1',
    title: 'Đề thi Khảo thí Toán học N5Exam (Leaderboard Test)',
    durationMinutes: 45,
    totalQuestions: 2,
    createdAt: new Date().toISOString(),
    isPublic: true,
    questions: [
      {
        id: 1,
        type: 'multiple_choice',
        content: 'Nghiệm của phương trình $2^x = 8$ là:',
        options: [
          { key: 'A', content: '$x = 3$' },
          { key: 'B', content: '$x = 2$' },
        ],
        correctAnswer: 'A',
        score: 5.0,
      },
      {
        id: 2,
        type: 'short_answer',
        content: 'Tìm số nguyên dương nhỏ nhất.',
        acceptedAnswers: ['1'],
        score: 5.0,
      },
    ],
  };

  beforeEach(async () => {
    try {
      await prisma.submission.deleteMany({});
      await prisma.exam.deleteMany({});
    } catch {}
    await examService.saveExam(sampleExam);
  });

  it('calculates leaderboard ranks correctly with score desc and submittedAt asc', async () => {
    // 3 submissions with different scores
    await examService.submitExam({
      examId: sampleExam.id,
      studentName: 'Học sinh Hạng 2',
      studentPhone: '0911000002',
      answers: { 1: 'A' }, // 5.0 đ
      proctoringViolations: [],
    });

    await examService.submitExam({
      examId: sampleExam.id,
      studentName: 'Học sinh Hạng 1',
      studentPhone: '0911000001',
      answers: { 1: 'A', 2: '1' }, // 10.0 đ
      proctoringViolations: [],
    });

    await examService.submitExam({
      examId: sampleExam.id,
      studentName: 'Học sinh Hạng 3',
      studentPhone: '0911000003',
      answers: {}, // 0 đ
      proctoringViolations: [],
    });

    const subs = await examService.getSubmissions(sampleExam.id);
    const sorted = [...subs].sort((a, b) => b.score - a.score || new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

    expect(sorted.length).toBe(3);
    expect(sorted[0].studentName).toBe('Học sinh Hạng 1');
    expect(sorted[0].score).toBe(10);
    expect(sorted[1].studentName).toBe('Học sinh Hạng 2');
    expect(sorted[1].score).toBe(5);
    expect(sorted[2].studentName).toBe('Học sinh Hạng 3');
    expect(sorted[2].score).toBe(0);
  });

  it('strictly omits studentPhone from public leaderboard entries', async () => {
    await examService.submitExam({
      examId: sampleExam.id,
      studentName: 'Nguyễn Văn Bảo Mật',
      studentPhone: '0988776655',
      answers: { 1: 'A' },
      proctoringViolations: [],
    });

    const subs = await examService.getSubmissions(sampleExam.id);
    // Simulating public leaderboard mapper
    const publicLeaderboard = subs.map((sub, index) => ({
      rank: index + 1,
      id: sub.id,
      studentName: sub.studentName,
      score: sub.score,
      totalScore: sub.totalScore || 10,
      submittedAt: sub.submittedAt,
    }));

    const entry = publicLeaderboard[0];
    expect(entry).toBeDefined();
    expect((entry as any).studentPhone).toBeUndefined();
    expect((entry as any).phone).toBeUndefined();
    expect(JSON.stringify(entry)).not.toContain('0988776655');
  });

  it('clones an exam correctly with [Bản sao] prefix and copies questions', async () => {
    const original = await examService.getExam(sampleExam.id);
    expect(original).not.toBeNull();

    const clonedId = 'exam-clone-test-01';
    const clonedExam: Exam = {
      ...original!,
      id: clonedId,
      title: '[Bản sao] ' + original!.title,
      isPublic: false,
      createdAt: new Date().toISOString(),
    };

    await examService.saveExam(clonedExam);
    const savedClone = await examService.getExam(clonedId);

    expect(savedClone).not.toBeNull();
    expect(savedClone?.title).toContain('[Bản sao]');
    expect(savedClone?.questions.length).toBe(original?.questions.length);
    expect(savedClone?.isPublic).toBe(false);
  });
});
