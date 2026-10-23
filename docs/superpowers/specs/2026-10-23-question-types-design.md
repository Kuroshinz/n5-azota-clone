# Design Specification: Support for True/False and Short Answer Questions (GDPT 2018)

## 1. Context & Objectives
Azota is widely used in Vietnam for administering online tests. Under the Ministry of Education and Training (GDPT 2018) examination format, tests are structured into three parts:
- **Part I**: Traditional 4-choice multiple choice questions (A, B, C, D).
- **Part II**: True/False questions (Câu trắc nghiệm Đúng/Sai) comprising 4 sub-items: `a), b), c), d)`.
- **Part III**: Short Answer questions (Câu trắc nghiệm Trả lời ngắn) where students fill in a precise numerical/algebraic result.

This specification details the end-to-end upgrade of `D:/Download/azota-clone` to natively support all three question types across domain types, parser regex, scoring engine, student exam room, and teacher dashboard.

## 2. Domain Model Specifications (`src/types/exam.ts`)

```typescript
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface SubQuestionItem {
  key: 'a' | 'b' | 'c' | 'd';
  content: string;
  correctAnswer?: boolean; // true = Đúng, false = Sai
}

export interface Question {
  id: number;
  type: QuestionType;
  rawText: string;
  content: string;
  score: number;
  explanation?: string;

  // For multiple_choice
  options?: Option[];
  correctAnswer?: OptionKey;

  // For true_false
  subItems?: SubQuestionItem[];

  // For short_answer
  acceptedAnswers?: string[];
}

export type StudentAnswerValue =
  | OptionKey
  | Record<'a' | 'b' | 'c' | 'd', boolean>
  | string;

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
```

## 3. Parser Specifications (`src/parser/examParser.ts`)
The parser will automatically identify the question type:
1. **True/False**:
   - Detects sub-items matching `(?:^|\n|\s{2,})([a-d])[\s.:\)]+\s*([^\n\r]+)`.
   - Detects answer key in inline form (`a) Đ, b) S...` or `a. Đúng, b. Sai`) or table key (`1. a-Đ, b-S, c-Đ, d-S`).
2. **Short Answer**:
   - Matches questions with no options and an explicit answer line: `(?:Đáp án|Đáp số|Kết quả)[\s.:]+([^\n\r]+)`.
   - Populates `acceptedAnswers` array with normalized variations (e.g., `-2.5`, `-2,5`, `-5/2`).
3. **Multiple Choice**:
   - Standard A/B/C/D option parser (preserved from Task 2).

## 4. Scoring Logic Specifications (`src/storage/examStorage.ts`)
- **Multiple Choice**: Student answer === `question.correctAnswer` -> awards full `question.score`.
- **True/False** (GDPT 2018 grading scale for 1.0 point base):
  - 1 correct sub-item: `0.1 * question.score`
  - 2 correct sub-items: `0.25 * question.score`
  - 3 correct sub-items: `0.5 * question.score`
  - 4 correct sub-items: `1.0 * question.score`
- **Short Answer**:
  - Normalize both student answer and accepted answers:
    - Replace `,` with `.`
    - Trim whitespaces
    - Case-insensitive comparison
  - Match -> awards full `question.score`.

## 5. UI Component Specifications (`src/components/QuestionCard.tsx`)
- **True/False Card**:
  - Renders the root question prompt with KaTeX math view.
  - Renders a clean 4-row table for sub-items `a, b, c, d`.
  - Each row contains two toggle pills: `[ Đúng ]` and `[ Sai ]`.
  - In review mode: highlights which items the student got right/wrong and reveals correct answers.
- **Short Answer Card**:
  - Renders root question prompt.
  - Large text input styled with numerical keypad comfort.
  - In review mode: displays student answer vs official accepted answer.

## 6. Verification & Test Plan
- Unit tests in `tests/parser.test.ts` for True/False and Short Answer extraction.
- Unit tests in `tests/storage.test.ts` for GDPT 2018 scoring of True/False and Short Answer.
- Typecheck with `npx tsc --noEmit`.
- Full suite verification with `npx vitest run`.
- Production build validation with `npm run build`.
