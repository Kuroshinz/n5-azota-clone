import { ProctoringReport } from './proctoring';

export type OptionKey = 'A' | 'B' | 'C' | 'D';

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface Option {
  key: 'A' | 'B' | 'C' | 'D';
  content: string;
}

export interface SubQuestionItem {
  key: 'a' | 'b' | 'c' | 'd';
  content: string;
  correctAnswer?: boolean; // true = Đúng, false = Sai
}

export type StudentAnswerValue =
  | OptionKey
  | Record<'a' | 'b' | 'c' | 'd', boolean>
  | string;

export interface Question {
  id: number;
  type?: QuestionType;
  rawText: string;
  content: string;
  score: number;
  explanation?: string;

  // Multiple choice
  options: Option[];
  correctAnswer?: OptionKey;

  // True/False
  subItems?: SubQuestionItem[];

  // Short answer
  acceptedAnswers?: string[];
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
  answers: Record<number, StudentAnswerValue>;
  score: number;
  totalScore: number;
  submittedAt: string;
  proctoringReport: ProctoringReport;
}
