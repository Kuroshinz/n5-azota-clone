# Advanced Exam Settings & Proctoring Toggle Design Document

## 1. Overview & Goals

Azota clone currently has a solid foundation: Vietnamese exam parsing (supporting GDPT 2018 True/False and Short Answer), SQLite persistence via Prisma, and client-side anti-cheat sensors.

This feature introduces **Advanced Exam Settings & Proctoring Control**:
1. **Practice vs. Official Exam Mode (`enableProctoring`)**: A dedicated toggle allowing teachers/creators to disable proctoring entirely for self-study/revision (no fullscreen requirement, no tab-switch warnings) or enable it for strict proctored examinations.
2. **Access Control & Scheduling**: Optional exam password (PIN code) and scheduled open/close windows (`startTime`, `endTime`).
3. **Smart Question & Option Shuffling (`shuffleQuestions`, `shuffleOptions`)**: Randomize presentation order per student while preserving question IDs and option keys for 100% accurate backend grading.
4. **Strict Anti-cheat & Auto-submit (`maxViolations`)**: In proctored mode, automatically submit the exam when the student exceeds the allowed violation limit (e.g. 3 tab switches) and log the violation reason.
5. **Post-submission Feedback Policy (`showResultAfterSubmit`)**: Configurable policy to show both score and detailed explanations, score only, or hide results until teacher publication.

---

## 2. Architecture & Data Model

### 2.1 Prisma Schema Extension

Update `prisma/schema.prisma` `Exam` model:

```prisma
model Exam {
  id              String       @id
  title           String
  durationMinutes Int          @default(45)
  totalQuestions  Int          @default(0)
  questionsJson   String
  settingsJson    String       @default("{}")
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  submissions     Submission[]

  @@map("exams")
}
```

### 2.2 Domain Types (`src/types/exam.ts`)

```typescript
export interface ExamSettings {
  password?: string;                  // Optional PIN/Password required to enter exam
  startTime?: string;                 // ISO string: exam cannot be taken before this time
  endTime?: string;                   // ISO string: exam cannot be submitted after this time
  shuffleQuestions: boolean;          // Randomize question order on client display
  shuffleOptions: boolean;            // Randomize choices A/B/C/D for multiple-choice questions
  enableProctoring: boolean;          // Toggle: true = strict proctoring, false = practice/revision mode
  maxViolations: number;              // Auto-submit threshold (e.g., 3). 0 = unlimited warnings without auto-submit
  showResultAfterSubmit:              // Result visibility policy
    | 'score_and_answers'             // Score + correct answers + full explanations
    | 'score_only'                    // Only total score and section breakdown
    | 'hidden';                       // Results hidden pending teacher release
}

export const DEFAULT_EXAM_SETTINGS: ExamSettings = {
  shuffleQuestions: false,
  shuffleOptions: false,
  enableProctoring: false,            // Default to friendly practice mode
  maxViolations: 3,
  showResultAfterSubmit: 'score_and_answers',
};
```

Update `Exam` interface:
```typescript
export interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  questions: Question[];
  settings?: ExamSettings;
  createdAt: string;
}
```

---

## 3. User Flows & Components

### 3.1 Teacher Create Page (`src/app/teacher/create/page.tsx`)

Add a dedicated **"Cấu hình đề thi" (Exam Settings)** section / modal before saving:
- **Chế độ làm bài (Mode Switch)**:
  - 🟢 **Ôn tập / Tự luyện (Practice)**: Tắt giám sát (`enableProctoring: false`). Học sinh không bị bắt buộc toàn màn hình, không bị cảnh báo chuyển tab.
  - 🛡️ **Thi chính thức (Proctored)**: Bật giám sát (`enableProctoring: true`). Bắt buộc toàn màn hình, ghi nhận vi phạm, tự động thu bài nếu vượt ngưỡng `maxViolations`.
- **Bảo mật & Thời gian**:
  - Mật khẩu vào thi (tùy chọn).
  - Ngày giờ mở đề (`startTime`) & Hạn chót nộp bài (`endTime`).
- **Đảo đề**:
  - Checkbox / Switch: Đảo thứ tự câu hỏi.
  - Checkbox / Switch: Đảo thứ tự đáp án A/B/C/D.
- **Xem kết quả sau khi thi**:
  - Radio options: "Xem điểm và đáp án chi tiết" / "Chỉ xem điểm" / "Không xem điểm (ẩn bài làm)".

### 3.2 Student Exam Room (`src/app/exam/[id]/page.tsx`)

#### A. Lobby / Verification Gate
1. **Time Check**:
   - If `startTime` > now: show countdown timer *"Chưa đến giờ mở đề thi. Đề thi sẽ mở sau: HH:mm:ss"*.
   - If `endTime` < now: show error *"Đề thi đã đóng vào lúc [endTime]"*.
2. **Password Gate**:
   - If `password` is set: show password prompt dialog before student can see any questions or start the timer.

#### B. Display Shuffling
- When starting exam, if `shuffleQuestions` is true, deterministic/client-side shuffle question order for display.
- If `shuffleOptions` is true, shuffle options per multiple-choice question.
- **Integrity Guarantee**: The answers map submitted to the server always uses the original `question.id` and original `option.key`, ensuring the grading engine in `examService.ts` computes scores 100% reliably.

#### C. Proctoring Behavior
- If `enableProctoring === false`:
  - Show a friendly green badge: *"Chế độ Ôn tập: Tự do chuyển tab & tra cứu"*.
  - Do NOT prompt for Fullscreen.
  - Do NOT open `ProctoringModal` on blur or tab switch.
- If `enableProctoring === true`:
  - Require Fullscreen when entering.
  - Attach `useProctoring` sensor.
  - Show warning modal on tab-switch/blur: *"Cảnh báo vi phạm lần X/N!"*.
  - When violations >= `maxViolations`: Modal shows alert *"Bạn đã vi phạm quy chế thi quá số lần cho phép. Hệ thống đang tự động nộp bài..."*, disables inputs, and immediately triggers `submitExam`.

#### D. Submission Result View
- If `showResultAfterSubmit === 'score_and_answers'`: Display score + correct answers + full explanations (current behavior).
- If `showResultAfterSubmit === 'score_only'`: Display score card, but hide question solution cards.
- If `showResultAfterSubmit === 'hidden'`: Display friendly completion screen: *"Nộp bài thành công! Giáo viên sẽ công bố kết quả sau."*

---

## 4. Backend Service & API Adjustments

### 4.1 `src/server/examService.ts`
- In `saveExam(exam: Exam)`: serialize `exam.settings` into `settingsJson`.
- In `getExam(id: string)` and `listExams()`: deserialize `settingsJson` into `exam.settings`. Fallback to `DEFAULT_EXAM_SETTINGS` if empty or null.
- In `submitExam`: validate password if required, and check `endTime` bounds.

---

## 5. Testing Plan

1. **Unit Tests (`tests/examSettings.test.ts`)**:
   - Verify serialization and deserialization of `ExamSettings` with default fallbacks.
   - Test password verification logic.
   - Test question and option shuffling (ensures all questions and options are preserved and IDs match).
   - Test time window validation (`startTime`, `endTime`).
2. **Component & Integration Verification**:
   - Verify practice mode: `useProctoring` does not trigger modal warnings when `enableProctoring` is false.
   - Verify strict mode: violations increment and auto-submit is triggered upon reaching `maxViolations`.
   - Verify result visibility policies (`score_and_answers`, `score_only`, `hidden`).
3. **Full Suite**:
   - All 32 existing tests + new settings tests must pass (`npm test`).
   - Clean production build (`npm run build`).
