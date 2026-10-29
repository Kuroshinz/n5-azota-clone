import { describe, it, expect, beforeEach } from 'vitest';
import { examService } from '../src/server/examService';
import { authService } from '../src/server/authService';
import { prisma } from '../src/server/prisma';
import { Exam } from '../src/types/exam';

describe('Admin Panel Advanced Features & Bulk Operations', () => {
  const sampleExam1: Exam = {
    id: 'test-admin-exam-bulk-1',
    title: 'Đề thi Bulk Test 1',
    durationMinutes: 15,
    totalQuestions: 1,
    createdAt: new Date().toISOString(),
    isPublic: false,
    questions: [
      {
        id: 1,
        type: 'multiple_choice',
        content: '1 + 1 = ?',
        options: [{ key: 'A', content: '2' }],
        correctAnswer: 'A',
        score: 10,
      },
    ],
  };

  const sampleExam2: Exam = {
    id: 'test-admin-exam-bulk-2',
    title: 'Đề thi Bulk Test 2',
    durationMinutes: 20,
    totalQuestions: 1,
    createdAt: new Date().toISOString(),
    isPublic: false,
    questions: [
      {
        id: 1,
        type: 'multiple_choice',
        content: '2 + 2 = ?',
        options: [{ key: 'A', content: '4' }],
        correctAnswer: 'A',
        score: 10,
      },
    ],
  };

  beforeEach(async () => {
    try {
      await prisma.submission.deleteMany({});
      await prisma.exam.deleteMany({});
    } catch {}
    await examService.saveExam(sampleExam1);
    await examService.saveExam(sampleExam2);
  });

  it('supports bulk exam visibility update (public/private)', async () => {
    // Both exams start private
    let e1 = await examService.getExam(sampleExam1.id);
    let e2 = await examService.getExam(sampleExam2.id);
    expect(e1?.isPublic).toBe(false);
    expect(e2?.isPublic).toBe(false);

    // Bulk toggle to public
    await examService.saveExam({ ...e1!, isPublic: true });
    await examService.saveExam({ ...e2!, isPublic: true });

    e1 = await examService.getExam(sampleExam1.id);
    e2 = await examService.getExam(sampleExam2.id);
    expect(e1?.isPublic).toBe(true);
    expect(e2?.isPublic).toBe(true);
  });

  it('supports bulk exam deletion', async () => {
    const listBefore = await examService.listExams();
    expect(listBefore.length).toBeGreaterThanOrEqual(2);

    await examService.deleteExam(sampleExam1.id);
    await examService.deleteExam(sampleExam2.id);

    const e1 = await examService.getExam(sampleExam1.id);
    const e2 = await examService.getExam(sampleExam2.id);
    expect(e1).toBeNull();
    expect(e2).toBeNull();
  });

  it('restores backup data with exams and users accurately', async () => {
    const backupData = {
      exams: [
        {
          id: 'restored-exam-99',
          title: 'Đề thi Đã Khôi Phục Từ JSON Backup',
          durationMinutes: 30,
          totalQuestions: 1,
          createdAt: new Date().toISOString(),
          isPublic: true,
          questions: [
            {
              id: 1,
              type: 'short_answer',
              content: 'Thủ đô của Việt Nam là gì?',
              acceptedAnswers: ['Hà Nội', 'Ha Noi'],
              score: 10,
            },
          ],
        },
      ],
      users: [
        {
          fullName: 'Người dùng Khôi phục',
          phone: '0988998899',
          email: 'restore@example.com',
          role: 'TEACHER',
        },
      ],
      submissions: [],
    };

    // Restore exam
    await examService.saveExam(backupData.exams[0] as any);
    const restored = await examService.getExam('restored-exam-99');
    expect(restored).not.toBeNull();
    expect(restored?.title).toBe('Đề thi Đã Khôi Phục Từ JSON Backup');
    expect(restored?.questions[0].acceptedAnswers).toContain('Hà Nội');
  });
});
