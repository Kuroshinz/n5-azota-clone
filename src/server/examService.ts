import { Exam, OptionKey, StudentAnswerValue, Submission, DEFAULT_EXAM_SETTINGS, ExamSettings } from '../types/exam';
import { ProctoringReport } from '../types/proctoring';
import { parseExamText } from '../parser/examParser';
import { calculateScore } from '../storage/examStorage';
import { prisma } from './prisma';

export interface SubmitExamParams {
  examId: string;
  userId?: string | null;
  studentName?: string;
  studentPhone?: string | null;
  answers: Record<number, StudentAnswerValue>;
  proctoringReport: ProctoringReport;
}

const DEFAULT_PROCTORING_REPORT: ProctoringReport = {
  outScreenCount: 0,
  fullscreenExitCount: 0,
  totalOutDurationSeconds: 0,
  events: [],
};

export class ExamService {
  public async createExamFromText(rawText: string, metadata?: Partial<Exam>): Promise<Exam> {
    const parsed = parseExamText(rawText, metadata);
    if (metadata?.settings) {
      parsed.settings = metadata.settings;
    }
    if (metadata?.authorId) {
      parsed.authorId = metadata.authorId;
    }
    await this.saveExam(parsed);
    return parsed;
  }

  public async saveExam(exam: Exam): Promise<Exam> {
    const questionsJson = JSON.stringify(exam.questions || []);
    const settingsJson = JSON.stringify(exam.settings || DEFAULT_EXAM_SETTINGS);

    await prisma.exam.upsert({
      where: { id: exam.id },
      create: {
        id: exam.id,
        title: exam.title,
        durationMinutes: exam.durationMinutes || 45,
        totalQuestions: exam.totalQuestions || exam.questions?.length || 0,
        questionsJson,
        settingsJson,
        authorId: exam.authorId ?? null,
        isPublic: exam.isPublic !== undefined ? exam.isPublic : true,
        createdAt: exam.createdAt ? new Date(exam.createdAt) : new Date(),
      },
      update: {
        title: exam.title,
        durationMinutes: exam.durationMinutes || 45,
        totalQuestions: exam.totalQuestions || exam.questions?.length || 0,
        questionsJson,
        settingsJson,
        authorId: exam.authorId !== undefined ? exam.authorId : undefined,
        isPublic: exam.isPublic !== undefined ? exam.isPublic : undefined,
      },
    });
    return exam;
  }

  public async getExam(id: string): Promise<Exam | null> {
    const record = await prisma.exam.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, fullName: true, phone: true }
        }
      }
    });
    if (!record) return null;

    let questions = [];
    try {
      questions = JSON.parse(record.questionsJson);
    } catch (e) {
      console.error('Failed to parse questionsJson for exam', id, e);
    }

    let settings: ExamSettings = { ...DEFAULT_EXAM_SETTINGS };
    try {
      if (record.settingsJson) {
        settings = { ...DEFAULT_EXAM_SETTINGS, ...JSON.parse(record.settingsJson) };
      }
    } catch (e) {
      console.error('Failed to parse settingsJson for exam', id, e);
    }

    return {
      id: record.id,
      title: record.title,
      durationMinutes: record.durationMinutes,
      totalQuestions: record.totalQuestions,
      createdAt: record.createdAt.toISOString(),
      authorId: record.authorId,
      isPublic: record.isPublic,
      author: record.author ? { id: record.author.id, fullName: record.author.fullName, phone: record.author.phone } : null,
      questions,
      settings,
    };
  }

  public async listExams(authorId?: string): Promise<Exam[]> {
    const records = await prisma.exam.findMany({
      where: authorId ? { authorId } : undefined,
      include: {
        author: {
          select: { id: true, fullName: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(record => {
      let questions = [];
      try {
        questions = JSON.parse(record.questionsJson);
      } catch (e) {
        console.error('Failed to parse questionsJson for exam', record.id, e);
      }

      let settings: ExamSettings = { ...DEFAULT_EXAM_SETTINGS };
      try {
        if (record.settingsJson) {
          settings = { ...DEFAULT_EXAM_SETTINGS, ...JSON.parse(record.settingsJson) };
        }
      } catch (e) {
        console.error('Failed to parse settingsJson for exam', record.id, e);
      }

      return {
        id: record.id,
        title: record.title,
        durationMinutes: record.durationMinutes,
        totalQuestions: record.totalQuestions,
        createdAt: record.createdAt.toISOString(),
        authorId: record.authorId,
        isPublic: record.isPublic,
        author: record.author ? { id: record.author.id, fullName: record.author.fullName, phone: record.author.phone } : null,
        questions,
        settings,
      };
    });
  }

  public async deleteExam(id: string): Promise<boolean> {
    try {
      await prisma.submission.deleteMany({
        where: { examId: id },
      });
      await prisma.exam.delete({
        where: { id },
      });
      return true;
    } catch (e) {
      console.error('Failed to delete exam', id, e);
      return false;
    }
  }

  public async submitExam(params: SubmitExamParams): Promise<Submission> {
    const exam = await this.getExam(params.examId);
    if (!exam) {
      throw new Error(`Exam with id ${params.examId} not found`);
    }

    const { score, totalScore } = calculateScore(exam, params.answers);

    const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const answersJson = JSON.stringify(params.answers || {});
    const proctoringReportJson = JSON.stringify(params.proctoringReport || DEFAULT_PROCTORING_REPORT);

    const record = await prisma.submission.create({
      data: {
        id: submissionId,
        examId: params.examId,
        userId: params.userId || null,
        studentName: params.studentName || 'Học sinh',
        studentPhone: params.studentPhone || null,
        score,
        totalScore,
        answersJson,
        proctoringReportJson,
      },
      include: {
        user: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
      },
    });

    return {
      id: record.id,
      examId: record.examId,
      userId: record.userId,
      studentName: record.studentName,
      studentPhone: record.studentPhone,
      answers: params.answers,
      score: record.score,
      totalScore: record.totalScore,
      submittedAt: record.submittedAt.toISOString(),
      proctoringReport: params.proctoringReport,
      user: record.user,
    };
  }

  public async getSubmission(id: string): Promise<Submission | null> {
    const record = await prisma.submission.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
      },
    });
    if (!record) return null;

    let answers: Record<number, StudentAnswerValue> = {};
    let proctoringReport: ProctoringReport = { ...DEFAULT_PROCTORING_REPORT };

    try {
      answers = JSON.parse(record.answersJson);
    } catch (e) {
      console.error('Failed to parse answersJson for submission', id, e);
    }

    try {
      proctoringReport = JSON.parse(record.proctoringReportJson);
    } catch (e) {
      console.error('Failed to parse proctoringReportJson for submission', id, e);
    }

    return {
      id: record.id,
      examId: record.examId,
      userId: record.userId,
      studentName: record.studentName,
      studentPhone: record.studentPhone,
      answers,
      score: record.score,
      totalScore: record.totalScore,
      submittedAt: record.submittedAt.toISOString(),
      proctoringReport,
      user: record.user,
    };
  }

  public async getSubmissions(examId?: string): Promise<Submission[]> {
    const records = await prisma.submission.findMany({
      where: examId ? { examId } : undefined,
      include: {
        user: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return records.map(record => {
      let answers: Record<number, StudentAnswerValue> = {};
      let proctoringReport: ProctoringReport = { ...DEFAULT_PROCTORING_REPORT };

      try {
        answers = JSON.parse(record.answersJson);
      } catch (e) {
        console.error('Failed to parse answersJson', record.id, e);
      }

      try {
        proctoringReport = JSON.parse(record.proctoringReportJson);
      } catch (e) {
        console.error('Failed to parse proctoringReportJson', record.id, e);
      }

      return {
        id: record.id,
        examId: record.examId,
        userId: record.userId,
        studentName: record.studentName,
        studentPhone: record.studentPhone,
        answers,
        score: record.score,
        totalScore: record.totalScore,
        submittedAt: record.submittedAt.toISOString(),
        proctoringReport,
        user: record.user,
      };
    });
  }
}

export const examService = new ExamService();
