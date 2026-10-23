# Task 5 Brief: Teacher Dashboard (Exam Upload, Parser Preview & Submission Review)

## Goal
Build the Teacher Dashboard enabling automated exam creation with live preview, exam management, API routes, and a detailed student submission review page with anti-cheat audit logs.

## Files to Create
- `D:/Download/azota-clone/src/server/examService.ts`
- `D:/Download/azota-clone/src/app/api/exams/route.ts`
- `D:/Download/azota-clone/src/app/api/submissions/route.ts`
- `D:/Download/azota-clone/src/app/teacher/create/page.tsx`
- `D:/Download/azota-clone/src/app/teacher/exams/page.tsx`
- `D:/Download/azota-clone/src/app/teacher/submissions/[id]/page.tsx`
- `D:/Download/azota-clone/src/app/page.tsx`
- `D:/Download/azota-clone/tests/api.test.ts`

## Requirements
1. `src/server/examService.ts`:
   - Unified exam service managing in-memory / storage CRUD operations for exams and submissions.
2. `src/app/api/exams/route.ts`:
   - `GET /api/exams`: returns list of exams.
   - `POST /api/exams`: creates exam (supports either direct Exam object or rawText parsing via `parseExamText`).
3. `src/app/api/submissions/route.ts`:
   - `GET /api/submissions`: returns list of submissions.
   - `POST /api/submissions`: saves submission and calculates score.
4. `src/app/teacher/create/page.tsx`:
   - Real-time exam creation with split-pane text editor and live parsed question preview.
5. `src/app/teacher/exams/page.tsx`:
   - Management table of created exams with student links and submission counts.
6. `src/app/teacher/submissions/[id]/page.tsx`:
   - Teacher audit review showing student answers, correct solutions, and anti-cheat timeline.
7. `src/app/page.tsx`:
   - Landing page with direct links to student exam and teacher portal.
8. `tests/api.test.ts`:
   - Integration tests verifying API routes and exam service logic.
