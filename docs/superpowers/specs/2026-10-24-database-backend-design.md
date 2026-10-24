# Database Backend & API Synchronization Design Specification

**Date:** 2026-10-24  
**Status:** Approved  
**Author:** Antigravity  
**Goal:** Replace ephemeral client-side memory and standalone localStorage storage with a persistent, server-side SQLite database managed via Prisma ORM, providing multi-device synchronization for exams and submissions while maintaining offline draft resilience for students.

---

## 1. Architectural Overview

```
[Teacher Browser]                          [Student Browser]
       │                                           │
  1. Create Exam                              3. Load Exam
  (Word / Text / Preview)                     (MathView / GDPT 2018)
       ▼                                           ▼
 POST /api/exams                             GET /api/exams/[id]
       │                                           │
       └───────────────────┬───────────────────────┘
                           ▼
                  [Next.js API Layer]
                           │
                           ▼
                  [ExamService Server]
                  (calculateScore, validation)
                           │
                           ▼
               [Prisma ORM (Client)]
                           │
                           ▼
               [SQLite Database (dev.db)]
               (exams, submissions)
                           ▲
       ┌───────────────────┴───────────────────────┐
       │                                           │
 POST /api/submissions                       GET /api/submissions?examId=...
  4. Submit Exam                              2. Review Submissions & Proctoring
  (Answers + Proctoring Report)               (Violations Timeline, Scorecard)
       ▲                                           ▲
       │                                           │
[Student Browser]                          [Teacher Browser]
```

### Global Constraints & Guarantees
- **Zero External Infrastructure:** Runs locally using SQLite (`prisma/dev.db`) without requiring Docker, cloud services, or external database servers.
- **100% Backward Compatibility:** Full fidelity preservation for GDPT 2018 question types (Multiple Choice, True/False 4 sub-items with 0.1/0.25/0.5/1.0 scale, Short Answer with comma normalization), KaTeX formulas, and embedded base64 markdown images.
- **Client Offline-First Draft Safety:** Student answer inputs continue to trigger instant local drafts (`localStorage.setItem('azota_draft_[id]', ...)`) to prevent any loss of work on network blips or accidental browser refresh.

---

## 2. Database Schema (`prisma/schema.prisma`)

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
  questionsJson   String       // Serialized Question[] JSON
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
  answersJson          String   // Serialized Record<number, StudentAnswerValue> JSON
  proctoringReportJson String   // Serialized ProctoringReport JSON
  submittedAt          DateTime @default(now())

  exam                 Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)

  @@index([examId])
  @@map("submissions")
}
```

### Schema Rationale
- Using a **Hybrid Document-Relational** model allows relational referential integrity and cascade deletion between `Exam` and `Submission`, while keeping the complex nested structures (`Question` with `subItems`, `options`, `acceptedAnswers`, and `ProctoringReport` with `timeline`) as JSON text fields.
- Eliminates brittle multi-table JOINs and makes extending question types (e.g., essay grading, matching questions) seamless without breaking database migrations.

---

## 3. Server Layer & Data Mapping (`src/server/examService.ts`)

`ExamService` serves as the single source of truth for database operations and business logic:

1. **`listExams(): Promise<Exam[]>`**:
   Queries `prisma.exam.findMany({ orderBy: { createdAt: 'desc' } })` and deserializes `questionsJson` to `Question[]`.
2. **`getExam(id: string): Promise<Exam | null>`**:
   Queries `prisma.exam.findUnique({ where: { id } })` and deserializes `questionsJson`.
3. **`saveExam(exam: Exam): Promise<Exam>`**:
   Uses `prisma.exam.upsert` using `exam.id`. Serializes `questions` into `questionsJson`.
4. **`submitExam(params: SubmitExamParams): Promise<Submission>`**:
   - Fetches the target `Exam` from database.
   - Computes score using domain `calculateScore(exam, params.answers)` ensuring accurate GDPT 2018 weighting and short answer tolerance.
   - Stores `Submission` record with serialized `answersJson` and `proctoringReportJson`.
5. **`getSubmissions(examId?: string): Promise<Submission[]>`**:
   Queries `prisma.submission.findMany({ where: examId ? { examId } : undefined, orderBy: { submittedAt: 'desc' } })` and deserializes `answersJson` and `proctoringReportJson`.

### Database Client Singleton (`src/server/prisma.ts`)
```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## 4. API Specification

### 1. `GET /api/exams`
- **Output:** `{ success: true, exams: Exam[] }`
- **Status:** 200 OK

### 2. `GET /api/exams/[id]`
- **Output:** `{ success: true, exam: Exam }` or `{ success: false, error: 'Exam not found' }`
- **Status:** 200 OK / 404 Not Found

### 3. `POST /api/exams`
- **Payload:** `{ exam: Exam }` or `{ rawText: string, title?: string, durationMinutes?: number }`
- **Output:** `{ success: true, exam: Exam }`
- **Status:** 200 OK / 400 Bad Request / 500 Server Error

### 4. `GET /api/submissions?examId=[id]`
- **Output:** `{ success: true, submissions: Submission[] }`
- **Status:** 200 OK

### 5. `POST /api/submissions`
- **Payload:** `{ examId: string, studentName: string, answers: Record<number, StudentAnswerValue>, proctoringReport: ProctoringReport }`
- **Output:** `{ success: true, submission: Submission }`
- **Status:** 200 OK / 400 Bad Request / 500 Server Error

---

## 5. Client Synchronization & Offline Draft Lifecycle

### Teacher Portal (`/teacher/create` & `/teacher/exams`)
- **Creation Flow:** On clicking "Lưu đề thi", client calls `POST /api/exams`. On HTTP 200, it mirrors the exam into local cache and displays the `ShareExamModal` with QR code and shareable link.
- **List Flow:** On page load, `/teacher/exams` fetches from `/api/exams`. If network is unavailable, falls back to `listExams()` from `localStorage`.

### Student Exam Room (`/exam/[id]`)
- **Initial Load:** Client fetches `/api/exams/[id]`. If server returns 404 or network fails, checks `localStorage` cache as fallback.
- **In-Progress Autosave:** Every answer selection updates local draft state `azota_draft_[id]` instantly.
- **Submission:** On submitting, calls `POST /api/submissions`. Upon success, calls `clearDraft(id)` and displays result modal with score and proctoring log.

### Teacher Review Portal (`/teacher/submissions/[id]`)
- Fetches real-time submissions from `GET /api/submissions?examId=[id]` so teachers can immediately see students' results from any device.

---

## 6. Testing Strategy

1. **Integration Tests (`tests/api.test.ts` & `tests/examService.test.ts`)**:
   - Seed and save an exam to SQLite.
   - Fetch the exam via `getExam`.
   - Submit answers simulating GDPT 2018 Part I, II, III.
   - Verify calculation of score and proctoring telemetry in the retrieved submission.
2. **Regression Verification**:
   - Execute all 28 existing unit tests (`npm test`).
   - Run typecheck (`npx tsc --noEmit`).
   - Run Next.js production build (`npm run build`).
