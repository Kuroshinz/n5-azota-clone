# User Authentication, Linked Submissions & Exam Review Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove classroom features, implement user authentication (Phone/Email + Password), link exam takers to submissions, and enable exam creators to view student submission lists and detailed answer reviews.

**Architecture:**
- **Database:** Prisma with SQLite. Add `User` model, link `Exam.authorId` -> `User`, and `Submission.userId` -> `User`. Remove `Classroom` and `Student` models.
- **Backend:** Next.js Route Handlers (`/api/auth/*`, `/api/exams`, `/api/submissions`). Standard password hashing (bcryptjs) and signed JWT / session cookies.
- **Frontend:** Auth context (`AuthProvider`, `useAuth`), Login/Register modals or pages (`/login`, `/register`), updated Navbar with user menu, gated exam taker workflow with auto-filled identity, and submission review UI (`/teacher/submissions/[id]` and `/teacher/submissions/[id]/review/[submissionId]`).

**Tech Stack:** Next.js 14 (App Router), Prisma ORM, SQLite, bcryptjs, jsonwebtoken, Lucide React, Tailwind CSS.

---

### Task 1: Clean Up Classroom Code & Revert Database Schema
**Files:**
- Modify: `prisma/schema.prisma`
- Delete: `src/app/teacher/classes/page.tsx`, `src/app/teacher/classes/[id]/page.tsx`
- Delete: `src/app/api/classrooms/route.ts`, `src/app/api/classrooms/[id]/route.ts`, `src/app/api/classrooms/[id]/students/route.ts`, `src/app/api/classrooms/[id]/students/[studentId]/route.ts`
- Delete: `src/server/classroomService.ts`
- Delete: `tests/classroomService.test.ts`, `tests/classroomApi.test.ts`
- Modify: `src/components/Navbar.tsx` (remove "Lớp học" link)

- [ ] **Step 1:** Remove Classroom and Student models from `prisma/schema.prisma` and add `User` model with relation to `Exam` and `Submission`.
- [ ] **Step 2:** Run `npx prisma db push` and `npx prisma generate`.
- [ ] **Step 3:** Remove classroom routes, service, and test files.
- [ ] **Step 4:** Remove "Lớp học" link from `src/components/Navbar.tsx`.
- [ ] **Step 5:** Run `npm test` and verify remaining tests pass.

---

### Task 2: Implement User Authentication Backend & Services
**Files:**
- Create: `src/server/authService.ts`
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/me/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Test: `tests/authService.test.ts`, `tests/authApi.test.ts`

- [ ] **Step 1:** Install `bcryptjs`, `jsonwebtoken` (and their types).
- [ ] **Step 2:** Write unit tests for `authService` (register, login, password verification, token issuance).
- [ ] **Step 3:** Implement `src/server/authService.ts`.
- [ ] **Step 4:** Implement API routes for `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`.
- [ ] **Step 5:** Write and run API integration tests `tests/authApi.test.ts`.

---

### Task 3: Client Authentication Context, Login & Register UI
**Files:**
- Create: `src/context/AuthContext.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/register/page.tsx`
- Modify: `src/app/layout.tsx` (wrap with `AuthProvider`)
- Modify: `src/components/Navbar.tsx` (show user profile, avatar, logout button or login/register buttons)

- [ ] **Step 1:** Implement `AuthContext` providing `user`, `login`, `register`, `logout`, `loading`.
- [ ] **Step 2:** Wrap root layout with `AuthProvider`.
- [ ] **Step 3:** Create modern, clean `/login` and `/register` pages with phone/email and password validation.
- [ ] **Step 4:** Update `Navbar` to display current user name, role badge, and dropdown/logout action.

---

### Task 4: Link Exam Creation & Exam Taker Workflow to User Account
**Files:**
- Modify: `src/app/teacher/create/page.tsx` (attach `authorId` to created exams)
- Modify: `src/app/teacher/exams/page.tsx` (filter by author or show creator tag)
- Modify: `src/app/exam/[id]/page.tsx` (require login before starting, pre-fill student info, link `userId` on submit)
- Modify: `src/server/examService.ts` & `src/app/api/submissions/route.ts` (store `userId` in `Submission`)

- [ ] **Step 1:** Update `Submission` creation in `/api/submissions/route.ts` to save `userId`.
- [ ] **Step 2:** Update `/exam/[id]/page.tsx` to require login. If unauthenticated, prompt login with return redirect.
- [ ] **Step 3:** Auto-fill student name & phone from authenticated user, lock identity so results accurately reflect account.
- [ ] **Step 4:** Attach current user ID when creating exams in `/teacher/create`.

---

### Task 5: Detailed Submission Results & Answer Review for Creators
**Files:**
- Modify: `src/app/teacher/submissions/[id]/page.tsx` (add "Xem chi tiết bài làm" action)
- Create: `src/app/teacher/submissions/[id]/review/[submissionId]/page.tsx` (full review UI)
- Create: `src/app/api/submissions/[submissionId]/route.ts` (fetch single submission details with answers & questions)

- [ ] **Step 1:** Implement `GET /api/submissions/[submissionId]` to return full exam content + student's submitted answers.
- [ ] **Step 2:** Update `/teacher/submissions/[id]` with student ranking, score badges, anti-cheat violations, and "Xem bài làm" button.
- [ ] **Step 3:** Create `/teacher/submissions/[id]/review/[submissionId]/page.tsx` rendering all questions, student's selected choices, correct choices, score per question, and solution explanations.
- [ ] **Step 4:** Run full end-to-end flow: Register Teacher -> Create Exam -> Register Student -> Take Exam & Submit -> Teacher Reviews Student Submission.
- [ ] **Step 5:** Verify tests and production build.
