# Database Backend & API Synchronization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate SQLite database persistence via Prisma ORM to synchronize exams and submissions across devices, provide robust API endpoints, and maintain client-side draft resilience.

**Architecture:** Prisma ORM connected to local SQLite database (`prisma/dev.db`); centralized `ExamService` in Next.js backend with JSON serialization for composite GDPT 2018 questions and proctoring telemetry; updated Next.js API routes; and hybrid client synchronization with `localStorage` draft cache.

**Tech Stack:** Next.js 14, React 18, TypeScript, Prisma ORM, SQLite, Vitest.

## Global Constraints
- Target directory: `D:/Download/azota-clone`
- Zero external services required: pure local SQLite database file.
- Backward compatibility: preserve all GDPT 2018 question types (Part I, Part II True/False scale, Part III short answer normalization), formulas, and base64 markdown images.
- All existing 28 Vitest tests must continue to pass without regressions.

---

### Task 1: Prisma & SQLite Scaffolding

**Files:**
- Modify: `package.json`
- Create: `prisma/schema.prisma`
- Create: `src/server/prisma.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `prisma` singleton client from `src/server/prisma.ts` with models `Exam` and `Submission`.

- [ ] **Step 1: Install Prisma dependencies**
Run:
```bash
npm install @prisma/client
npm install -D prisma
```

- [ ] **Step 2: Create `prisma/schema.prisma`**
Create `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Exam {
  id              String       @id
  title           String
  durationMinutes Int          @default(45)
  totalQuestions  Int          @default(0)
  questionsJson   String
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  submissions     Submission[]

  @@map("exams")
}

model Submission {
  id                   String   @id
  examId               String
  studentName          String   @default("Học sinh")
  score                Float    @default(0)
  totalScore           Float    @default(10)
  answersJson          String
  proctoringReportJson String
  submittedAt          DateTime @default(now())

  exam                 Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)

  @@index([examId])
  @@map("submissions")
}
```

- [ ] **Step 3: Add database file and migrations to `.gitignore`**
Ensure `prisma/dev.db` and `prisma/dev.db-journal` are excluded in `.gitignore`.

- [ ] **Step 4: Push database schema and generate Prisma client**
Run:
```bash
npx prisma db push
```

- [ ] **Step 5: Create singleton Prisma client `src/server/prisma.ts`**
Create `src/server/prisma.ts`:
```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 6: Verify Prisma client generation and TypeScript check**
Run:
```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 7: Commit**
```bash
git add prisma/schema.prisma src/server/prisma.ts package.json package-lock.json .gitignore
git commit -m "feat(db): setup Prisma ORM with SQLite database and singleton client"
```

---

### Task 2: Refactor ExamService with Prisma Persistence & Unit Tests

**Files:**
- Modify: `src/server/examService.ts`
- Create: `tests/examService.test.ts`

**Interfaces:**
- Consumes: `prisma` from `src/server/prisma.ts`, `Exam`, `Submission`, `calculateScore`.
- Produces:
```ts
export class ExamService {
  createExamFromText(rawText: string, metadata?: Partial<Exam>): Promise<Exam>;
  saveExam(exam: Exam): Promise<Exam>;
  getExam(id: string): Promise<Exam | null>;
  listExams(): Promise<Exam[]>;
  submitExam(params: SubmitExamParams): Promise<Submission>;
  getSubmission(id: string): Promise<Submission | null>;
  getSubmissions(examId?: string): Promise<Submission[]>;
}
```

- [ ] **Step 1: Write unit tests in `tests/examService.test.ts`**
Test saving, getting, listing exams, and submitting an exam with score and proctoring telemetry.

- [ ] **Step 2: Run test to observe failures**
Run:
```bash
npx vitest run tests/examService.test.ts
```

- [ ] **Step 3: Implement Prisma-backed `src/server/examService.ts`**
Implement JSON serialization for `questions` and deserialization for `Question[]`, `StudentAnswerValue`, and `ProctoringReport`.

- [ ] **Step 4: Run unit tests to verify they pass**
Run:
```bash
npx vitest run tests/examService.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/server/examService.ts tests/examService.test.ts
git commit -m "feat(server): integrate ExamService with Prisma SQLite database"
```

---

### Task 3: API Routes Integration & Tests

**Files:**
- Modify: `src/app/api/exams/route.ts`
- Create: `src/app/api/exams/[id]/route.ts`
- Modify: `src/app/api/submissions/route.ts`
- Modify: `tests/api.test.ts`

**Interfaces:**
- Produces:
  - `GET /api/exams`
  - `POST /api/exams`
  - `GET /api/exams/[id]`
  - `GET /api/submissions`
  - `POST /api/submissions`

- [ ] **Step 1: Update `tests/api.test.ts` with async ExamService & route handlers**
- [ ] **Step 2: Implement `src/app/api/exams/[id]/route.ts`**
- [ ] **Step 3: Update `src/app/api/exams/route.ts` and `src/app/api/submissions/route.ts` for async `examService`**
- [ ] **Step 4: Run Vitest on API tests**
Run:
```bash
npx vitest run tests/api.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/api/ tests/api.test.ts
git commit -m "feat(api): connect exam and submission API routes with Prisma persistence"
```

---

### Task 4: Teacher Exam Creation & Exam Management Sync

**Files:**
- Modify: `src/app/teacher/create/page.tsx`
- Modify: `src/app/teacher/exams/page.tsx`

**Interfaces:**
- In `/teacher/create`: on save, send `POST /api/exams` to persist in DB; mirror to localStorage cache; open `ShareExamModal`.
- In `/teacher/exams`: on mount, fetch `GET /api/exams`; fallback to `listExams()` from localStorage if offline.

- [ ] **Step 1: Update `src/app/teacher/create/page.tsx` to save exam via API**
- [ ] **Step 2: Update `src/app/teacher/exams/page.tsx` to load exams from API with fallback**
- [ ] **Step 3: Verify TypeScript compilation**
Run:
```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 4: Commit**
```bash
git add src/app/teacher/create/page.tsx src/app/teacher/exams/page.tsx
git commit -m "feat(teacher): sync exam creation and management with backend API"
```

---

### Task 5: Student Exam Room, Submission Review & E2E Verification

**Files:**
- Modify: `src/app/exam/[id]/page.tsx`
- Modify: `src/app/teacher/submissions/[id]/page.tsx`

**Interfaces:**
- In `/exam/[id]`: fetch exam from `/api/exams/[id]` with localStorage fallback; autosave drafts to localStorage; submit via `POST /api/submissions`.
- In `/teacher/submissions/[id]`: fetch real-time submissions from `/api/submissions?examId=[id]`.

- [ ] **Step 1: Update `src/app/exam/[id]/page.tsx` to fetch and submit via API with instant draft autosave**
- [ ] **Step 2: Update `src/app/teacher/submissions/[id]/page.tsx` to fetch submissions from API**
- [ ] **Step 3: Run complete Vitest suite**
Run:
```bash
npx vitest run
```
Expected: All tests PASS

- [ ] **Step 4: Run production build**
Run:
```bash
npm run build
```
Expected: Production build successfully generated with 0 errors

- [ ] **Step 5: Commit**
```bash
git add src/app/exam/[id]/page.tsx src/app/teacher/submissions/[id]/page.tsx
git commit -m "feat(client): complete hybrid database sync for exam room and teacher reviews"
```
