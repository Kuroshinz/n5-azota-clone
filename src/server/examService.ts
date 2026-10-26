import { Exam, OptionKey, StudentAnswerValue, Submission, DEFAULT_EXAM_SETTINGS, ExamSettings } from '../types/exam';
import { ProctoringReport } from '../types/proctoring';
import { parseExamText } from '../parser/examParser';
import { calculateScore, getExam as getLocalExam, saveExam as saveLocalExam, listExams as listLocalExams, getSubmissions as getLocalSubmissions, saveSubmission as saveLocalSubmission, deleteExam as deleteLocalExam } from '../storage/examStorage';
import { prisma, isDatabaseConfigured } from './prisma';

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

// In-memory fallback submissions when PostgreSQL is unavailable (stored on globalThis for Next.js webpack consistency)
const globalForExamService = globalThis as unknown as {
  __memoryExamServiceSubmissions?: Map<string, Submission>;
};
const memorySubmissions = globalForExamService.__memoryExamServiceSubmissions || new Map<string, Submission>();
globalForExamService.__memoryExamServiceSubmissions = memorySubmissions;

export class ExamService {
  public async createExamFromText(rawText: string, metadata?: Partial<Exam>): Promise<Exam> {
    const parsed = parseExamText(rawText, metadata);
    if (metadata?.settings) {
      parsed.settings = metadata.settings;
    }
    if (metadata?.authorId) {
      parsed.authorId = metadata.authorId;
    }
    if (metadata?.isPublic !== undefined) {
      parsed.isPublic = metadata.isPublic;
    }
    await this.saveExam(parsed);
    return parsed;
  }

  public async saveExam(exam: Exam): Promise<Exam> {
    if (!exam.settings) {
      exam.settings = { ...DEFAULT_EXAM_SETTINGS };
    }
    saveLocalExam(exam);

    if (isDatabaseConfigured) {
      const questionsJson = JSON.stringify(exam.questions || []);
      const settingsJson = JSON.stringify(exam.settings || DEFAULT_EXAM_SETTINGS);

      try {
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
      } catch (e: any) {
        console.warn('Prisma unavailable in saveExam, preserved in local memory store:', e.message);
      }
    }
    return exam;
  }

  public async getExam(id: string): Promise<Exam | null> {
    if (isDatabaseConfigured) {
      try {
        const record = await prisma.exam.findUnique({
          where: { id },
          include: {
            author: {
              select: { id: true, fullName: true, phone: true }
            },
            _count: {
              select: { submissions: true }
            }
          }
        });
        if (record) {
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
            submissionCount: (record as any)._count?.submissions || 0,
            questions,
            settings,
          };
        }
      } catch {
        // Fallback below
      }
    }

    const local = getLocalExam(id);
    if (local) {
      if (!local.settings) {
        local.settings = { ...DEFAULT_EXAM_SETTINGS };
      }
      return {
        ...local,
        submissionCount: (local as any).submissionCount ?? getLocalSubmissions(local.id).length,
      };
    }
    return null;
  }

  public async listExams(authorId?: string): Promise<Exam[]> {
    if (isDatabaseConfigured) {
      try {
        const records = await prisma.exam.findMany({
          where: authorId ? { authorId } : undefined,
          include: {
            author: {
              select: { id: true, fullName: true, phone: true }
            },
            _count: {
              select: { submissions: true }
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
            submissionCount: (record as any)._count?.submissions || 0,
            questions,
            settings,
          };
        });
      } catch {}
    }

    const local = listLocalExams();
    const result = authorId ? local.filter(e => e.authorId === authorId) : local;
    return result.map(e => ({
      ...e,
      submissionCount: (e as any).submissionCount ?? getLocalSubmissions(e.id).length,
    }));
  }

  public async deleteExam(id: string): Promise<boolean> {
    deleteLocalExam(id);
    for (const [sId, s] of memorySubmissions.entries()) {
      if (s.examId === id) memorySubmissions.delete(sId);
    }

    if (isDatabaseConfigured) {
      try {
        await prisma.exam.delete({
          where: { id },
        });
      } catch {}
    }
    return true;
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

    const submissionObj: Submission = {
      id: submissionId,
      examId: params.examId,
      userId: params.userId || null,
      studentName: params.studentName || 'Học sinh',
      studentPhone: params.studentPhone || null,
      answers: params.answers,
      score,
      totalScore,
      submittedAt: new Date().toISOString(),
      proctoringReport: params.proctoringReport,
    };

    saveLocalSubmission(submissionObj);
    memorySubmissions.set(submissionId, submissionObj);

    if (isDatabaseConfigured) {
      try {
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
      } catch (e: any) {
        console.warn('Prisma unavailable in submitExam, saved to memory/localStorage:', e.message);
      }
    }

    return submissionObj;
  }

  public async getSubmission(id: string): Promise<Submission | null> {
    if (isDatabaseConfigured) {
      try {
        const record = await prisma.submission.findUnique({
          where: { id },
          include: {
            user: {
              select: { id: true, fullName: true, phone: true, email: true },
            },
          },
        });
        if (record) {
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
      } catch {}
    }

    return memorySubmissions.get(id) || null;
  }

  public async getSubmissions(examId?: string): Promise<Submission[]> {
    if (isDatabaseConfigured) {
      try {
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
      } catch {}
    }

    const all = Array.from(memorySubmissions.values());
    if (examId) {
      return all.filter(s => s.examId === examId);
    }
    return all;
  }
}

export const examService = new ExamService();
