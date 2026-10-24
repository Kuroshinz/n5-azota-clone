import { Exam, OptionKey, StudentAnswerValue, Submission } from '../types/exam';
import { ProctoringReport } from '../types/proctoring';
import { parseExamText } from '../parser/examParser';
import { calculateScore } from '../storage/examStorage';
import { prisma } from './prisma';

export interface SubmitExamParams {
  examId: string;
  studentName: string;
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
    await this.saveExam(parsed);
    return parsed;
  }

  public async saveExam(exam: Exam): Promise<Exam> {
    const questionsJson = JSON.stringify(exam.questions || []);
    await prisma.exam.upsert({
      where: { id: exam.id },
      create: {
        id: exam.id,
        title: exam.title,
        durationMinutes: exam.durationMinutes || 45,
        totalQuestions: exam.totalQuestions || exam.questions?.length || 0,
        questionsJson,
        createdAt: exam.createdAt ? new Date(exam.createdAt) : new Date(),
      },
      update: {
        title: exam.title,
        durationMinutes: exam.durationMinutes || 45,
        totalQuestions: exam.totalQuestions || exam.questions?.length || 0,
        questionsJson,
      },
    });
    return exam;
  }

  public async getExam(id: string): Promise<Exam | null> {
    const record = await prisma.exam.findUnique({
      where: { id },
    });
    if (!record) return null;

    let questions = [];
    try {
      questions = JSON.parse(record.questionsJson);
    } catch (e) {
      console.error('Failed to parse questionsJson for exam', id, e);
    }

    return {
      id: record.id,
      title: record.title,
      durationMinutes: record.durationMinutes,
      totalQuestions: record.totalQuestions,
      createdAt: record.createdAt.toISOString(),
      questions,
    };
  }

  public async listExams(): Promise<Exam[]> {
    const records = await prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return records.map(record => {
      let questions = [];
      try {
        questions = JSON.parse(record.questionsJson);
      } catch (e) {
        console.error('Failed to parse questionsJson for exam', record.id, e);
      }
      return {
        id: record.id,
        title: record.title,
        durationMinutes: record.durationMinutes,
        totalQuestions: record.totalQuestions,
        createdAt: record.createdAt.toISOString(),
        questions,
      };
    });
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
        studentName: params.studentName || 'Học sinh',
        score,
        totalScore,
        answersJson,
        proctoringReportJson,
      },
    });

    return {
      id: record.id,
      examId: record.examId,
      studentName: record.studentName,
      answers: params.answers,
      score: record.score,
      totalScore: record.totalScore,
      submittedAt: record.submittedAt.toISOString(),
      proctoringReport: params.proctoringReport,
    };
  }

  public async getSubmission(id: string): Promise<Submission | null> {
    const record = await prisma.submission.findUnique({
      where: { id },
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
      studentName: record.studentName,
      answers,
      score: record.score,
      totalScore: record.totalScore,
      submittedAt: record.submittedAt.toISOString(),
      proctoringReport,
    };
  }

  public async getSubmissions(examId?: string): Promise<Submission[]> {
    const records = await prisma.submission.findMany({
      where: examId ? { examId } : undefined,
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
        studentName: record.studentName,
        answers,
        score: record.score,
        totalScore: record.totalScore,
        submittedAt: record.submittedAt.toISOString(),
        proctoringReport,
      };
    });
  }
}

export const examService = new ExamService();
