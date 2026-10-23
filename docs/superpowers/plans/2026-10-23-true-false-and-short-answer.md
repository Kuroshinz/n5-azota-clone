# True/False & Short Answer Question Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Azota Clone with support for Vietnam GDPT 2018 examination question formats: Part II (True/False with 4 sub-items a, b, c, d) and Part III (Short Answer numerical/algebraic inputs), complete with regex parsing, GDPT 2018 grading rules, interactive UI cards, and review mode.

**Architecture:** Domain types extension in `src/types/exam.ts`, regex pattern extraction in `src/parser/examParser.ts`, grading scale calculator in `src/storage/examStorage.ts`, and specialized UI components in `src/components/QuestionCard.tsx` and the exam room `/exam/[id]`.

**Tech Stack:** Next.js 14, React 18, TypeScript, TailwindCSS, KaTeX, Vitest.

## Global Constraints
- Target directory: `D:/Download/azota-clone`
- Backward compatibility: Existing Multiple Choice (Part I) questions and tests must continue to pass 100%.
- GDPT 2018 True/False grading scale: 1 item = 0.1đ, 2 items = 0.25đ, 3 items = 0.5đ, 4 items = 1.0đ.
- Short Answer normalization: comma `,` normalized to dot `.`, whitespace trimmed, case-insensitive comparison.

---

### Task 1: Core Domain Model & Types Extension

**Files:**
- Modify: `D:/Download/azota-clone/src/types/exam.ts`
- Modify: `D:/Download/azota-clone/tests/types.test.ts`

**Interfaces:**
- Produces: `QuestionType`, `SubQuestionItem`, `StudentAnswerValue`, updated `Question`, updated `Submission`.

- [ ] **Step 1: Write failing type test for True/False and Short Answer questions**
- [ ] **Step 2: Update `src/types/exam.ts` to include `QuestionType`, `SubQuestionItem`, and `StudentAnswerValue`**
- [ ] **Step 3: Run Vitest and typecheck to verify Task 1 passes**

---

### Task 2: Parser Extension for True/False and Short Answer

**Files:**
- Modify: `D:/Download/azota-clone/src/parser/examParser.ts`
- Modify: `D:/Download/azota-clone/tests/parser.test.ts`

**Interfaces:**
- Consumes: `QuestionType`, `SubQuestionItem` from `src/types/exam.ts`
- Produces: `parseExamText` supporting `true_false` and `short_answer` detection alongside `multiple_choice`.

- [ ] **Step 1: Write failing parser tests covering Part II (True/False) and Part III (Short Answer)**
- [ ] **Step 2: Implement regex sub-item extractor for a/b/c/d and answer detector (Đ/S, True/False)**
- [ ] **Step 3: Implement short answer value extractor (`Đáp án: [giá trị]`, `Đáp số: [giá trị]`)**
- [ ] **Step 4: Run Vitest to verify all parser tests pass**

---

### Task 3: Scoring & Tolerance Engine Extension

**Files:**
- Modify: `D:/Download/azota-clone/src/storage/examStorage.ts`
- Modify: `D:/Download/azota-clone/tests/storage.test.ts`

**Interfaces:**
- Produces: `calculateScore` updated to compute GDPT 2018 True/False scale and Short Answer normalized matching.

- [ ] **Step 1: Write failing storage and scoring unit tests for True/False (0.1, 0.25, 0.5, 1.0) and Short Answer tolerances**
- [ ] **Step 2: Implement True/False sub-item comparison and GDPT 2018 grading logic**
- [ ] **Step 3: Implement Short Answer normalization logic (comma to dot, whitespace trimming)**
- [ ] **Step 4: Run Vitest to verify scoring tests pass**

---

### Task 4: UI Components for True/False & Short Answer

**Files:**
- Modify: `D:/Download/azota-clone/src/components/QuestionCard.tsx`
- Modify: `D:/Download/azota-clone/src/components/QuestionNavGrid.tsx`

**Interfaces:**
- Produces: `QuestionCard` supporting 3 rendering modes (`multiple_choice`, `true_false`, `short_answer`) for both exam-taking and post-exam review.

- [ ] **Step 1: Implement True/False 4-row sub-item table with toggle pills [Đúng | Sai]**
- [ ] **Step 2: Implement Short Answer numeric input with live MathView preview**
- [ ] **Step 3: Implement post-submission review mode for True/False and Short Answer**
- [ ] **Step 4: Update QuestionNavGrid answered state for composite question types**

---

### Task 5: End-to-End Integration in Exam Room, Teacher Portal & Sample Data

**Files:**
- Modify: `D:/Download/azota-clone/src/app/exam/[id]/page.tsx`
- Modify: `D:/Download/azota-clone/src/app/teacher/create/page.tsx`
- Modify: `D:/Download/azota-clone/src/app/teacher/exams/page.tsx`
- Modify: `D:/Download/azota-clone/src/app/teacher/submissions/[id]/page.tsx`

**Interfaces:**
- Produces: Fully integrated sample exam containing all 3 parts (Phần I, Phần II, Phần III).

- [ ] **Step 1: Update sample exam template in `create/page.tsx` and default exam in `exam/[id]/page.tsx` with all 3 question types**
- [ ] **Step 2: Run all unit tests across the whole project (`npx vitest run`)**
- [ ] **Step 3: Verify TypeScript compilation (`npx tsc --noEmit`)**
- [ ] **Step 4: Verify Next.js production build (`npm run build`)**
