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

export interface ExamSettings {
  password?: string;                  // Mật khẩu đề thi (PIN/Password)
  startTime?: string;                 // Thời gian mở đề (ISO string)
  endTime?: string;                   // Thời gian đóng đề / hạn nộp (ISO string)
  shuffleQuestions: boolean;          // Đảo thứ tự câu hỏi
  shuffleOptions: boolean;            // Đảo thứ tự phương án A/B/C/D
  enableProctoring: boolean;          // BẬT / TẮT GIÁM SÁT (false = Ôn tập / tự luyện, true = Thi chính thức)
  maxViolations: number;              // Số lần vi phạm tối đa (0 = không giới hạn)
  showResultAfterSubmit:              // Chế độ xem kết quả sau khi thi
    | 'score_and_answers'             // Xem cả điểm + đáp án chi tiết
    | 'score_only'                    // Chỉ xem điểm số
    | 'hidden';                       // Ẩn hoàn toàn (chờ giáo viên công bố)
}

export const DEFAULT_EXAM_SETTINGS: ExamSettings = {
  shuffleQuestions: false,
  shuffleOptions: false,
  enableProctoring: false,            // Mặc định là chế độ Ôn tập
  maxViolations: 3,
  showResultAfterSubmit: 'score_and_answers',
};

export interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  questions: Question[];
  settings?: ExamSettings;
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
