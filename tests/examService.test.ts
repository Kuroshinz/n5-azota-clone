import { describe, it, expect, beforeEach } from 'vitest';
import { examService } from '../src/server/examService';
import { Exam } from '../src/types/exam';
import { prisma } from '../src/server/prisma';

describe('ExamService with Prisma SQLite Persistence', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.submission.deleteMany({});
    await prisma.exam.deleteMany({});
  });

  const sampleExam: Exam = {
    id: 'test-exam-prisma-1',
    title: 'Đề kiểm tra GDPT 2018 Toán học (SQLite)',
    durationMinutes: 45,
    totalQuestions: 3,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 1,
        type: 'multiple_choice',
        rawText: 'Câu 1...',
        content: 'Phương trình bậc hai $x^2 - 4 = 0$ có nghiệm dương là:',
        options: [
          { key: 'A', content: '$x = 2$' },
          { key: 'B', content: '$x = -2$' },
          { key: 'C', content: '$x = 4$' },
          { key: 'D', content: '$x = 1$' },
        ],
        correctAnswer: 'A',
        explanation: 'Ta có $x^2 = 4 \\Rightarrow x = 2$ hoặc $x = -2$. Nghiệm dương là $x = 2$.',
        score: 0.25,
      },
      {
        id: 2,
        type: 'true_false',
        rawText: 'Câu 2...',
        content: 'Cho hàm số $y = x^3 - 3x$. Các mệnh đề sau đúng hay sai?',
        options: [],
        subItems: [
          { key: 'a', content: 'Đạo hàm là $y\' = 3x^2 - 3$', correctAnswer: true },
          { key: 'b', content: 'Hàm số đồng biến trên $(-\\infty; -1)$', correctAnswer: true },
          { key: 'c', content: 'Điểm cực đại là $x = 1$', correctAnswer: false },
          { key: 'd', content: 'Giá trị cực tiểu bằng $-2$', correctAnswer: true },
        ],
        score: 1.0,
      },
      {
        id: 3,
        type: 'short_answer',
        rawText: 'Câu 3...',
        content: 'Cho đồ thị ![Hình vẽ](data:image/png;base64,abc). Số điểm cực trị là:',
        options: [],
        acceptedAnswers: ['2', '2.0', '2,0'],
        score: 0.5,
      },
    ],
  };

  it('saves an exam to SQLite and retrieves it with full fidelity', async () => {
    await examService.saveExam(sampleExam);

    // Verify row directly in SQLite database table
    const directDbRecord = await prisma.exam.findUnique({ where: { id: sampleExam.id } });
    expect(directDbRecord).not.toBeNull();
    expect(directDbRecord?.id).toBe(sampleExam.id);
    expect(directDbRecord?.title).toBe(sampleExam.title);
    expect(directDbRecord?.questionsJson).toContain('Phương trình bậc hai');

    const fetched = await examService.getExam(sampleExam.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(sampleExam.id);
    expect(fetched?.title).toBe(sampleExam.title);
    expect(fetched?.questions).toHaveLength(3);

    // Verify GDPT 2018 Part II subItems
    expect(fetched?.questions[1].type).toBe('true_false');
    expect(fetched?.questions[1].subItems).toHaveLength(4);
    expect(fetched?.questions[1].subItems?.[0].correctAnswer).toBe(true);

    // Verify Short Answer & Image markdown
    expect(fetched?.questions[2].type).toBe('short_answer');
    expect(fetched?.questions[2].content).toContain('![Hình vẽ](data:image/png;base64,abc)');
    expect(fetched?.questions[2].acceptedAnswers).toContain('2');
  });

  it('lists exams ordered by createdAt descending from SQLite', async () => {
    await examService.saveExam(sampleExam);
    await examService.saveExam({
      ...sampleExam,
      id: 'test-exam-prisma-2',
      title: 'Đề thi số 2',
    });

    const directCount = await prisma.exam.count();
    expect(directCount).toBe(2);

    const list = await examService.listExams();
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.some(e => e.id === 'test-exam-prisma-1')).toBe(true);
    expect(list.some(e => e.id === 'test-exam-prisma-2')).toBe(true);
  });

  it('creates an exam from raw text and persists directly to SQLite', async () => {
    const rawText = `Câu 1: $1 + 1 = ?$
A. 1
B. 2
C. 3
D. 4
Đáp án: B`;

    const created = await examService.createExamFromText(rawText, {
      title: 'Đề thi tạo từ Text',
      durationMinutes: 15,
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Đề thi tạo từ Text');

    const inDb = await prisma.exam.findUnique({ where: { id: created.id } });
    expect(inDb).not.toBeNull();
    expect(inDb?.questionsJson).toContain('Câu 1');
  });

  it('submits exam, computes accurate GDPT 2018 score and stores into SQLite table', async () => {
    await examService.saveExam(sampleExam);

    const submission = await examService.submitExam({
      examId: sampleExam.id,
      studentName: 'Nguyễn Văn A',
      answers: {
        1: 'A', // Correct (+0.25)
        2: { a: true, b: true, c: false, d: true }, // 4/4 correct (+1.0)
        3: '2,0', // Correct normalized (+0.5)
      },
      proctoringReport: {
        totalViolations: 2,
        tabSwitches: 1,
        fullscreenExits: 1,
        timeline: [
          {
            timestamp: new Date().toISOString(),
            type: 'out_screen',
            message: 'Thí sinh chuyển tab',
          },
        ],
      },
    });

    expect(submission.score).toBe(1.75); // 0.25 + 1.0 + 0.5
    expect(submission.studentName).toBe('Nguyễn Văn A');
    expect(submission.proctoringReport.totalViolations).toBe(2);

    // Verify submission row directly in SQLite
    const subDb = await prisma.submission.findUnique({ where: { id: submission.id } });
    expect(subDb).not.toBeNull();
    expect(subDb?.score).toBe(1.75);
    expect(subDb?.proctoringReportJson).toContain('out_screen');

    // Verify getSubmissions by examId
    const subs = await examService.getSubmissions(sampleExam.id);
    expect(subs).toHaveLength(1);
    expect(subs[0].id).toBe(submission.id);
  });
});
