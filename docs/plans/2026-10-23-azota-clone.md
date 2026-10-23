# Azota Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Azota-like online examination platform featuring automated DOCX/text exam parsing with LaTeX math support, a student exam room with anti-cheat proctoring (tab switch/fullscreen detection), and teacher exam management.

**Architecture:** Modern Fullstack Web Application using Next.js 14+ (App Router), TypeScript, TailwindCSS, KaTeX for math formulas, Lucide icons, and local persistent SQLite database for tests, questions, and submissions.

**Tech Stack:** Next.js, React 18+, TypeScript, TailwindCSS, KaTeX, Lucide React, Mammoth (DOCX parser), Vitest for unit testing.

## Global Constraints

- Target directory: `D:/Download/azota-clone`
- Vietnamese language support for exam parsing (`Câu X:`, `Bài X:`, `A.`, `B.`, `C.`, `D.`, `Hướng dẫn giải`)
- Full proctoring telemetry matching Azota's core behavior: `visibilitychange`, `blur`, `fullscreenchange`
- Zero external cloud services required to run locally

---

### Task 1: Project Scaffolding & Core Domain Types

**Files:**
- Create: `D:/Download/azota-clone/package.json`
- Create: `D:/Download/azota-clone/tsconfig.json`
- Create: `D:/Download/azota-clone/tailwind.config.js`
- Create: `D:/Download/azota-clone/src/types/exam.ts`
- Create: `D:/Download/azota-clone/src/types/proctoring.ts`
- Test: `D:/Download/azota-clone/tests/types.test.ts`

**Interfaces:**
- Produces: `Exam`, `Question`, `Option`, `Submission`, `ProctoringEvent`, `ProctoringReport`

- [ ] **Step 1: Write types unit test**
- [ ] **Step 2: Initialize project and write domain types**
- [ ] **Step 3: Verify TypeScript compilation and test passes**

---

### Task 2: Vietnamese Exam & Math Parser Engine

**Files:**
- Create: `D:/Download/azota-clone/src/parser/examParser.ts`
- Create: `D:/Download/azota-clone/src/parser/mathConverter.ts`
- Test: `D:/Download/azota-clone/tests/parser.test.ts`

**Interfaces:**
- Consumes: `Question`, `Option`, `Exam` from `src/types/exam.ts`
- Produces: `parseExamText(rawText: string, metadata?: Partial<Exam>): Exam`
- Produces: `cleanMathFormulas(content: string): string`

- [ ] **Step 1: Write failing parser tests covering standard exams and math formulas**
- [ ] **Step 2: Implement regex-based question splitter, options matcher, and answer key detector**
- [ ] **Step 3: Run Vitest to verify all exam parsing test cases pass**

---

### Task 3: Proctoring & Anti-Cheat Engine (Client-side Sensor)

**Files:**
- Create: `D:/Download/azota-clone/src/proctoring/ProctoringSensor.ts`
- Create: `D:/Download/azota-clone/src/hooks/useProctoring.ts`
- Test: `D:/Download/azota-clone/tests/proctoring.test.ts`

**Interfaces:**
- Consumes: `ProctoringEvent`, `ProctoringReport` from `src/types/proctoring.ts`
- Produces: `ProctoringSensor` class and `useProctoring(options)` hook
- Produces events: `out_screen` (tab change/blur), `fullscreen_exit`, `inactivity`

- [ ] **Step 1: Write failing unit test simulating DOM events (visibilitychange, blur, fullscreenchange)**
- [ ] **Step 2: Implement ProctoringSensor with event listeners and violation counters**
- [ ] **Step 3: Run Vitest to verify sensor tracks and reports violations correctly**

---

### Task 4: Student Exam Room UI & Auto-Save

**Files:**
- Create: `D:/Download/azota-clone/src/components/MathView.tsx`
- Create: `D:/Download/azota-clone/src/components/QuestionCard.tsx`
- Create: `D:/Download/azota-clone/src/components/QuestionNavGrid.tsx`
- Create: `D:/Download/azota-clone/src/components/ProctoringModal.tsx`
- Create: `D:/Download/azota-clone/src/app/exam/[id]/page.tsx`
- Create: `D:/Download/azota-clone/src/storage/examStorage.ts`

**Interfaces:**
- Consumes: `Exam`, `Question`, `ProctoringSensor`, `useProctoring`
- Produces: Interactive exam-taking page with countdown timer, autosave, and KaTeX equation rendering

- [ ] **Step 1: Implement MathView component with KaTeX rendering**
- [ ] **Step 2: Implement QuestionCard and QuestionNavGrid with answer state (answered, unanswered, flagged)**
- [ ] **Step 3: Implement ProctoringModal warning popup when student exits fullscreen or leaves tab**
- [ ] **Step 4: Build exam taking page `/exam/[id]` with countdown timer and autosave to localStorage & API**

---

### Task 5: Teacher Dashboard (Exam Upload, Parser Preview & Submission Review)

**Files:**
- Create: `D:/Download/azota-clone/src/app/teacher/create/page.tsx`
- Create: `D:/Download/azota-clone/src/app/teacher/exams/page.tsx`
- Create: `D:/Download/azota-clone/src/app/teacher/submissions/[id]/page.tsx`
- Create: `D:/Download/azota-clone/src/server/examService.ts`
- Create: `D:/Download/azota-clone/src/app/api/exams/route.ts`
- Create: `D:/Download/azota-clone/src/app/api/submissions/route.ts`

**Interfaces:**
- Consumes: `parseExamText`, `Exam`, `Submission`, `ProctoringReport`
- Produces: Teacher UI to upload exam, edit questions, inspect student scores and view cheating violation logs

- [ ] **Step 1: Implement exam storage service & API endpoints (CRUD exams and submissions)**
- [ ] **Step 2: Implement Teacher Create Exam page with text/DOCX input and live question preview**
- [ ] **Step 3: Implement Submission Review page showing calculated score, student answers vs correct answers, and cheating timeline report**
- [ ] **Step 4: Verify complete end-to-end flow from Exam Creation -> Student Exam Taking with Anti-Cheat -> Teacher Grade & Audit Inspection**
