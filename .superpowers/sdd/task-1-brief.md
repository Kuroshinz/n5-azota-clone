# Task 1 Brief: Project Scaffolding & Core Domain Types

## Goal
Set up the `D:/Download/azota-clone` project with Next.js/TypeScript/Tailwind configuration and core domain types for exams, questions, submissions, and proctoring events.

## Files to Create
- `D:/Download/azota-clone/package.json`
- `D:/Download/azota-clone/tsconfig.json`
- `D:/Download/azota-clone/src/types/exam.ts`
- `D:/Download/azota-clone/src/types/proctoring.ts`
- `D:/Download/azota-clone/tests/types.test.ts`
- `D:/Download/azota-clone/vitest.config.ts`

## Requirements
1. `src/types/exam.ts`:
   - `Option`: `{ key: 'A' | 'B' | 'C' | 'D'; content: string }`
   - `Question`: `{ id: number; rawText: string; content: string; options: Option[]; correctAnswer?: 'A' | 'B' | 'C' | 'D'; explanation?: string; score: number }`
   - `Exam`: `{ id: string; title: string; durationMinutes: number; totalQuestions: number; questions: Question[]; createdAt: string }`
   - `Submission`: `{ id: string; examId: string; studentName: string; answers: Record<number, 'A' | 'B' | 'C' | 'D'>; score: number; totalScore: number; submittedAt: string; proctoringReport: ProctoringReport }`
2. `src/types/proctoring.ts`:
   - `ProctoringEventType`: `'out_screen' | 'fullscreen_exit' | 'inactivity' | 'blur' | 'visibility_hidden'`
   - `ProctoringEvent`: `{ type: ProctoringEventType; timestamp: number; details?: string }`
   - `ProctoringReport`: `{ outScreenCount: number; fullscreenExitCount: number; totalOutDurationSeconds: number; events: ProctoringEvent[] }`
3. Setup `vitest` for running TypeScript tests.
4. `tests/types.test.ts` verifies valid instantiation and schema structure of `Exam` and `ProctoringReport`.
5. Run tests with `npx vitest run tests/types.test.ts`. Commit with `git add . && git commit -m "feat: scaffold project and define core types"`.
