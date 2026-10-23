# Task 4 Brief: Student Exam Room UI & Auto-Save

## Goal
Build the student examination room UI with KaTeX math rendering, responsive question cards, quick navigation grid, anti-cheat proctoring warnings, countdown timer, auto-save to localStorage, and final submission scoring.

## Files to Create
- `D:/Download/azota-clone/src/components/MathView.tsx`
- `D:/Download/azota-clone/src/components/QuestionCard.tsx`
- `D:/Download/azota-clone/src/components/QuestionNavGrid.tsx`
- `D:/Download/azota-clone/src/components/ProctoringModal.tsx`
- `D:/Download/azota-clone/src/storage/examStorage.ts`
- `D:/Download/azota-clone/src/app/globals.css`
- `D:/Download/azota-clone/src/app/layout.tsx`
- `D:/Download/azota-clone/src/app/exam/[id]/page.tsx`
- `D:/Download/azota-clone/tests/storage.test.ts`

## Requirements
1. `src/components/MathView.tsx`:
   - Safely renders mixed text and LaTeX formulas (`$...$` and `$$...$$`) using `katex.renderToString`.
2. `src/components/QuestionCard.tsx`:
   - Displays question index, content, A/B/C/D option selections, flag toggle, and score indicator.
3. `src/components/QuestionNavGrid.tsx`:
   - Visual grid reflecting answered, unanswered, flagged, and active states with click-to-scroll.
4. `src/components/ProctoringModal.tsx`:
   - Modal dialog that displays anti-cheat warning when user switches tabs or leaves fullscreen.
5. `src/storage/examStorage.ts`:
   - LocalStorage and in-memory persistence for exams, drafts, and submissions.
   - Includes seed exam fallback.
6. `src/app/exam/[id]/page.tsx`:
   - Complete interactive student exam environment with countdown timer, auto-save, anti-cheat telemetry, and score calculation on submit.
7. `tests/storage.test.ts`:
   - Unit tests verifying storage, scoring calculation, and draft persistence.
