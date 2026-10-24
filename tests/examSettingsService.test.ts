import { describe, it, expect, beforeEach } from 'vitest';
import { ExamService } from '../src/server/examService';
import { Exam, ExamSettings, DEFAULT_EXAM_SETTINGS } from '../src/types/exam';

describe('ExamService Settings Integration', () => {
  let service: ExamService;

  beforeEach(() => {
    service = new ExamService();
  });

  it('persists and retrieves custom exam settings', async () => {
    const customSettings: ExamSettings = {
      password: 'azota-test-pin',
      startTime: '2026-10-24T08:00:00.000Z',
      endTime: '2026-10-24T12:00:00.000Z',
      shuffleQuestions: true,
      shuffleOptions: true,
      enableProctoring: true,
      maxViolations: 5,
      showResultAfterSubmit: 'score_only',
    };

    const exam: Exam = {
      id: 'exam-settings-test-' + Date.now(),
      title: 'Đề kiểm tra nâng cao có cấu hình',
      durationMinutes: 60,
      totalQuestions: 1,
      questions: [
        {
          id: 1,
          type: 'multiple_choice',
          content: 'Thủ đô của Việt Nam là gì?',
          rawText: 'Thủ đô của Việt Nam là gì?',
          score: 10,
          options: [
            { key: 'A', content: 'Hà Nội' },
            { key: 'B', content: 'TP.HCM' },
          ],
          correctAnswer: 'A',
        },
      ],
      settings: customSettings,
      createdAt: new Date().toISOString(),
    };

    await service.saveExam(exam);

    const fetched = await service.getExam(exam.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.settings).toBeDefined();
    expect(fetched?.settings?.password).toBe('azota-test-pin');
    expect(fetched?.settings?.enableProctoring).toBe(true);
    expect(fetched?.settings?.maxViolations).toBe(5);
    expect(fetched?.settings?.showResultAfterSubmit).toBe('score_only');
    expect(fetched?.settings?.shuffleQuestions).toBe(true);
    expect(fetched?.settings?.shuffleOptions).toBe(true);
  });

  it('falls back to DEFAULT_EXAM_SETTINGS when settings are omitted', async () => {
    const exam: Exam = {
      id: 'exam-default-settings-' + Date.now(),
      title: 'Đề mặc định',
      durationMinutes: 45,
      totalQuestions: 0,
      questions: [],
      createdAt: new Date().toISOString(),
    };

    await service.saveExam(exam);

    const fetched = await service.getExam(exam.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.settings?.enableProctoring).toBe(false); // Practice mode by default
    expect(fetched?.settings?.showResultAfterSubmit).toBe('score_and_answers');
    expect(fetched?.settings?.maxViolations).toBe(3);
  });
});
