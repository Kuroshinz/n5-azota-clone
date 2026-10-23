import { Exam, OptionKey, Submission } from '../types/exam';
import { ProctoringReport } from '../types/proctoring';
import { parseExamText } from '../parser/examParser';
import {
  saveExam,
  getExam,
  listExams,
  saveSubmission,
  getSubmission,
  getSubmissions,
  calculateScore,
} from '../storage/examStorage';

export interface SubmitExamParams {
  examId: string;
  studentName: string;
  answers: Record<number, OptionKey>;
  proctoringReport: ProctoringReport;
}

export class ExamService {
  public createExamFromText(rawText: string, metadata?: Partial<Exam>): Exam {
    const parsed = parseExamText(rawText, metadata);
    saveExam(parsed);
    return parsed;
  }

  public saveExam(exam: Exam): void {
    saveExam(exam);
  }

  public getExam(id: string): Exam | null {
    return getExam(id);
  }

  public listExams(): Exam[] {
    return listExams();
  }

  public submitExam(params: SubmitExamParams): Submission {
    const exam = this.getExam(params.examId);
    if (!exam) {
      throw new Error(`Exam with id ${params.examId} not found`);
    }

    const { score, totalScore } = calculateScore(exam, params.answers);

    const submission: Submission = {
      id: `sub-${Date.now()}`,
      examId: params.examId,
      studentName: params.studentName || 'Học sinh',
      answers: params.answers,
      score,
      totalScore,
      submittedAt: new Date().toISOString(),
      proctoringReport: params.proctoringReport,
    };

    saveSubmission(submission);
    return submission;
  }

  public getSubmission(id: string): Submission | null {
    return getSubmission(id);
  }

  public getSubmissions(examId?: string): Submission[] {
    return getSubmissions(examId);
  }
}

export const examService = new ExamService();
