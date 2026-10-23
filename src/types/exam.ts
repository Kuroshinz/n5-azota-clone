import { ProctoringReport } from './proctoring';

export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface Option {
  key: 'A' | 'B' | 'C' | 'D';
  content: string;
}

export interface Question {
  id: number;
  rawText: string;
  content: string;
  options: Option[];
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  score: number;
}

export interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  questions: Question[];
  createdAt: string;
}

export interface Submission {
  id: string;
  examId: string;
  studentName: string;
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  score: number;
  totalScore: number;
  submittedAt: string;
  proctoringReport: ProctoringReport;
}
