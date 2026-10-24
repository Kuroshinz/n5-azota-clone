# Advanced Exam Settings & Anti-Cheat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide teachers with configurable exam parameters (Practice vs Proctored mode, Password, Start/End Schedule, Question/Option Shuffling, Auto-submit violation threshold, and Result visibility policy) and enforce them seamlessly in the student exam room.

**Architecture:** Extend SQLite `Exam` model with `settingsJson`; provide pure deterministic shuffling and access-check utilities in `src/utils/examSettings.ts`; build an intuitive `ExamSettingsModal` for the teacher creation flow; and update `/exam/[id]` with gate checks, practice mode bypassing, and violation threshold auto-submission.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, Lucide React, Prisma ORM (SQLite), Vitest.

## Global Constraints
- Target directory: `D:/Download/azota-clone`
- Backward compatibility: Existing exams without explicit settings default cleanly to `DEFAULT_EXAM_SETTINGS` (`enableProctoring: false`, `showResultAfterSubmit: 'score_and_answers'`).
- Scoring integrity: Shuffling must NEVER alter the underlying `question.id` or `option.key` submitted to the backend. Scores must be 100% identical to unshuffled grading.
- All existing 32 Vitest unit tests must continue to pass without regressions.

---

### Task 1: Domain Types, Prisma Schema & Exam Settings Helpers

**Files:**
- Modify: `src/types/exam.ts`
- Modify: `prisma/schema.prisma`
- Create: `src/utils/examSettings.ts`
- Create: `tests/examSettings.test.ts`

**Interfaces:**
- Produces in `src/types/exam.ts`:
  ```ts
  export interface ExamSettings {
    password?: string;
    startTime?: string;
    endTime?: string;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    enableProctoring: boolean;
    maxViolations: number;
    showResultAfterSubmit: 'score_and_answers' | 'score_only' | 'hidden';
  }
  export const DEFAULT_EXAM_SETTINGS: ExamSettings;
  ```
- Produces in `src/utils/examSettings.ts`:
  - `shuffleExamQuestions(questions: Question[], shuffleQuestions: boolean, shuffleOptions: boolean): Question[]`
  - `validateExamAccess(settings?: ExamSettings, passwordInput?: string, currentTime?: Date): { allowed: boolean; reason?: 'not_started' | 'ended' | 'invalid_password' }`

- [ ] **Step 1: Write unit tests in `tests/examSettings.test.ts`**
  - Test shuffling questions and options (verifies questions array is randomized if enabled, but all original IDs, options, and scores are preserved).
  - Test access validation (password check, startTime in future, endTime in past, valid access).
  - Test default fallback helper.

- [ ] **Step 2: Update `src/types/exam.ts`**
  - Add `ExamSettings` and `DEFAULT_EXAM_SETTINGS`.
  - Add optional `settings?: ExamSettings` to `Exam` interface.

- [ ] **Step 3: Update `prisma/schema.prisma` & push schema**
  - Add `settingsJson String @default("{}")` to `model Exam`.
  - Run `npx prisma db push`.

- [ ] **Step 4: Implement `src/utils/examSettings.ts`**
  - Implement `shuffleExamQuestions` and `validateExamAccess`.

- [ ] **Step 5: Run Vitest to verify tests pass**
  - Run `npx vitest run tests/examSettings.test.ts`

- [ ] **Step 6: Commit**
  - `git add src/types/exam.ts prisma/schema.prisma src/utils/examSettings.ts tests/examSettings.test.ts`
  - `git commit -m "feat(settings): add exam settings types, prisma schema, and shuffle/access utilities"`

---

### Task 2: Service & API Routes Synchronization

**Files:**
- Modify: `src/server/examService.ts`
- Modify: `src/app/api/exams/route.ts`
- Modify: `src/app/api/exams/[id]/route.ts`
- Create: `tests/examSettingsService.test.ts`

**Interfaces:**
- `ExamService.saveExam`: serializes `exam.settings` into `settingsJson`.
- `ExamService.getExam`: deserializes `settingsJson` into `exam.settings`, falling back to `DEFAULT_EXAM_SETTINGS`.
- `ExamService.listExams`: includes parsed `settings` in each exam.

- [ ] **Step 1: Write integration tests in `tests/examSettingsService.test.ts`**
  - Test saving an exam with custom settings (password, proctoring disabled, shuffling enabled).
  - Test retrieving it via `ExamService.getExam(id)` and verify all settings match.
  - Test backwards compatibility: exam with empty `settingsJson` defaults to `DEFAULT_EXAM_SETTINGS`.

- [ ] **Step 2: Update `src/server/examService.ts`**
  - Serialize `settingsJson` on create/save.
  - Deserialize `settingsJson` on `getExam` and `listExams`.

- [ ] **Step 3: Update API routes**
  - Ensure `src/app/api/exams/route.ts` and `src/app/api/exams/[id]/route.ts` pass and return `settings`.

- [ ] **Step 4: Run Vitest on service tests**
  - Run `npx vitest run tests/examSettingsService.test.ts`

- [ ] **Step 5: Commit**
  - `git add src/server/examService.ts src/app/api/ tests/examSettingsService.test.ts`
  - `git commit -m "feat(api): persist and serialize exam settings in ExamService and API routes"`

---

### Task 3: Teacher Portal Exam Settings UI

**Files:**
- Create: `src/components/ExamSettingsModal.tsx`
- Modify: `src/app/teacher/create/page.tsx`
- Modify: `src/app/teacher/exams/page.tsx`

**Interfaces:**
- Produces `ExamSettingsModal`:
  - Toggle: "Chế độ làm bài" (🟢 Ôn tập / Tự luyện vs 🛡️ Thi có giám sát).
  - Input: Mật khẩu bảo vệ đề thi.
  - Inputs: Ngày giờ mở đề (`startTime`), Hạn chót nộp bài (`endTime`).
  - Toggles: Đảo câu hỏi, Đảo đáp án A/B/C/D.
  - Selector: Giới hạn số lần vi phạm (1, 3, 5, hoặc Không giới hạn).
  - Radio: Quyền xem kết quả (Điểm & đáp án / Chỉ xem điểm / Ẩn kết quả).
- Consumed by `src/app/teacher/create/page.tsx` before/on saving.
- In `src/app/teacher/exams/page.tsx`: shows badges `🟢 Ôn tập` vs `🛡️ Giám sát`, password lock icon if protected.

- [ ] **Step 1: Implement `src/components/ExamSettingsModal.tsx`**
  - Beautiful modal matching Tailwind theme with toggles and tooltips.

- [ ] **Step 2: Connect Settings into `src/app/teacher/create/page.tsx`**
  - Add state `settings: ExamSettings = DEFAULT_EXAM_SETTINGS`.
  - Add button "⚙️ Cấu hình đề thi" next to "Lưu đề thi".
  - Include `settings` when calling `/api/exams` and `saveExam`.

- [ ] **Step 3: Update `src/app/teacher/exams/page.tsx`**
  - Show status badges (Ôn tập vs Giám sát, Có mật khẩu, Đảo đề).

- [ ] **Step 4: Run typecheck**
  - Run `npx tsc --noEmit`

- [ ] **Step 5: Commit**
  - `git add src/components/ExamSettingsModal.tsx src/app/teacher/create/page.tsx src/app/teacher/exams/page.tsx`
  - `git commit -m "feat(teacher): add exam settings modal and management badges"`

---

### Task 4: Student Exam Room Integration (Gate, Shuffling & Auto-Submit)

**Files:**
- Modify: `src/app/exam/[id]/page.tsx`
- Modify: `src/components/ProctoringModal.tsx`

**Interfaces:**
- In `/exam/[id]`:
  - Lobby: Check `startTime`, `endTime`, prompt password if `settings.password` is defined.
  - Display: Shuffle questions and options if enabled via `shuffleExamQuestions`.
  - Proctoring:
    - If `settings.enableProctoring === false`: show "🟢 Chế độ Ôn tập" badge; do not initialize fullscreen/sensor warnings.
    - If `settings.enableProctoring === true`: require fullscreen; show "Cảnh báo vi phạm lần X / N" in `ProctoringModal`.
    - If violations >= `settings.maxViolations` (and `maxViolations > 0`): trigger automatic submit immediately with notification.
  - Post-submission: respect `settings.showResultAfterSubmit` (hide answer explanations if `score_only` or `hidden`).

- [ ] **Step 1: Update `src/components/ProctoringModal.tsx`**
  - Support showing `maxViolations` and dynamic alert when limit is reached.

- [ ] **Step 2: Update `src/app/exam/[id]/page.tsx` with Access Gate & Password Prompt**
  - Add PIN / password dialog before starting.
  - Validate schedule window.

- [ ] **Step 3: Update `src/app/exam/[id]/page.tsx` with Shuffling & Practice Mode logic**
  - Apply `shuffleExamQuestions` on exam start.
  - Check `settings.enableProctoring`: conditionally mount/start sensor.
  - Handle auto-submit when violation limit is reached.
  - Handle `showResultAfterSubmit` display.

- [ ] **Step 4: Run typecheck**
  - Run `npx tsc --noEmit`

- [ ] **Step 5: Commit**
  - `git add src/app/exam/[id]/page.tsx src/components/ProctoringModal.tsx`
  - `git commit -m "feat(student): enforce exam access gate, shuffling, practice toggle, and auto-submit"`

---

### Task 5: End-to-End Verification & Full Test Suite

**Files:**
- All test suites in `tests/`

- [ ] **Step 1: Run complete Vitest suite**
  - Run `npm test`
  - Expected: All test files PASS.

- [ ] **Step 2: Run production build**
  - Run `npm run build`
  - Expected: Build completes with 0 errors.

- [ ] **Step 3: Final Commit**
  - Commit any remaining polish and documentation updates.
