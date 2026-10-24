import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registerHandler } from '../src/app/api/auth/register/route';
import { GET as getExamsHandler, POST as createExamHandler } from '../src/app/api/exams/route';
import { PUT as updateExamHandler, DELETE as deleteExamHandler } from '../src/app/api/exams/[id]/route';
import { GET as getSubmissionsHandler, POST as submitExamHandler } from '../src/app/api/submissions/route';
import { prisma } from '../src/server/prisma';
import { NextRequest } from 'next/server';

describe('Data Privacy & Authorization Isolation', () => {
  let userAToken: string;
  let userBToken: string;
  let studentCToken: string;

  beforeEach(async () => {
    // Clean test data
    await prisma.submission.deleteMany();
    await prisma.exam.deleteMany({
      where: {
        title: { startsWith: 'TEST_PRIVACY_' }
      }
    });
    await prisma.user.deleteMany({
      where: {
        phone: { in: ['0911000001', '0911000002', '0911000003'] }
      }
    });

    // 1. Create User A
    const resA = await registerHandler(new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Giáo Viên A', phone: '0911000001', password: 'Password123' })
    }));
    userAToken = resA.cookies.get('azota_token')!.value;

    // 2. Create User B
    const resB = await registerHandler(new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Giáo Viên B', phone: '0911000002', password: 'Password123' })
    }));
    userBToken = resB.cookies.get('azota_token')!.value;

    // 3. Create Student C
    const resC = await registerHandler(new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Học Sinh C', phone: '0911000003', password: 'Password123' })
    }));
    studentCToken = resC.cookies.get('azota_token')!.value;
  });

  it('ensures exams are strictly isolated between accounts', async () => {
    // User A creates Exam A
    const resCreateA = await createExamHandler(new NextRequest('http://localhost:3000/api/exams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `azota_token=${userAToken}`
      },
      body: JSON.stringify({
        id: 'exam-priv-a',
        title: 'TEST_PRIVACY_EXAM_A',
        questions: [{ id: 1, type: 'multiple_choice', content: 'Q1', options: [{ key: 'A', content: 'Ans' }], correctAnswer: 'A', score: 10 }]
      })
    }));
    expect(resCreateA.status).toBe(200);

    // User B creates Exam B
    const resCreateB = await createExamHandler(new NextRequest('http://localhost:3000/api/exams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `azota_token=${userBToken}`
      },
      body: JSON.stringify({
        id: 'exam-priv-b',
        title: 'TEST_PRIVACY_EXAM_B',
        questions: [{ id: 1, type: 'multiple_choice', content: 'Q1', options: [{ key: 'A', content: 'Ans' }], correctAnswer: 'A', score: 10 }]
      })
    }));
    expect(resCreateB.status).toBe(200);

    // User A lists exams -> ONLY sees Exam A
    const listA = await getExamsHandler(new NextRequest('http://localhost:3000/api/exams', {
      headers: { cookie: `azota_token=${userAToken}` }
    }));
    const dataA = await listA.json();
    expect(dataA.exams.length).toBe(1);
    expect(dataA.exams[0].id).toBe('exam-priv-a');

    // User B lists exams -> ONLY sees Exam B
    const listB = await getExamsHandler(new NextRequest('http://localhost:3000/api/exams', {
      headers: { cookie: `azota_token=${userBToken}` }
    }));
    const dataB = await listB.json();
    expect(dataB.exams.length).toBe(1);
    expect(dataB.exams[0].id).toBe('exam-priv-b');
  });

  it('prevents non-authors from editing or deleting other users exams', async () => {
    // User A creates Exam A
    await createExamHandler(new NextRequest('http://localhost:3000/api/exams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `azota_token=${userAToken}`
      },
      body: JSON.stringify({
        id: 'exam-priv-a',
        title: 'TEST_PRIVACY_EXAM_A',
        questions: [{ id: 1, type: 'multiple_choice', content: 'Q1', options: [{ key: 'A', content: 'Ans' }], correctAnswer: 'A', score: 10 }]
      })
    }));

    // User B tries to update Exam A -> 403 Forbidden
    const resUpdate = await updateExamHandler(
      new NextRequest('http://localhost:3000/api/exams/exam-priv-a', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          cookie: `azota_token=${userBToken}`
        },
        body: JSON.stringify({ title: 'Hacked by B' })
      }),
      { params: { id: 'exam-priv-a' } }
    );
    expect(resUpdate.status).toBe(403);

    // User B tries to delete Exam A -> 403 Forbidden
    const resDelete = await deleteExamHandler(
      new NextRequest('http://localhost:3000/api/exams/exam-priv-a', {
        method: 'DELETE',
        headers: { cookie: `azota_token=${userBToken}` }
      }),
      { params: { id: 'exam-priv-a' } }
    );
    expect(resDelete.status).toBe(403);
  });

  it('protects student submissions: only exam author sees class list; student sees only own score', async () => {
    // User A creates Exam A
    await createExamHandler(new NextRequest('http://localhost:3000/api/exams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `azota_token=${userAToken}`
      },
      body: JSON.stringify({
        id: 'exam-priv-a',
        title: 'TEST_PRIVACY_EXAM_A',
        questions: [{ id: 1, type: 'multiple_choice', content: 'Q1', options: [{ key: 'A', content: 'Ans' }], correctAnswer: 'A', score: 10 }]
      })
    }));

    // Student C takes Exam A
    const subRes = await submitExamHandler(new NextRequest('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `azota_token=${studentCToken}`
      },
      body: JSON.stringify({
        examId: 'exam-priv-a',
        answers: { 1: 'A' },
        proctoringReport: { outScreenCount: 0, fullscreenExitCount: 0, totalOutDurationSeconds: 0, events: [] }
      })
    }));
    expect(subRes.status).toBe(200);

    // Author (User A) queries submissions for Exam A -> sees student C
    const authorRes = await getSubmissionsHandler(new NextRequest('http://localhost:3000/api/submissions?examId=exam-priv-a', {
      headers: { cookie: `azota_token=${userAToken}` }
    }));
    const authorData = await authorRes.json();
    expect(authorData.isAuthor).toBe(true);
    expect(authorData.submissions.length).toBe(1);
    expect(authorData.submissions[0].studentName).toBe('Học Sinh C');

    // Non-author teacher (User B) queries submissions for Exam A -> returns 0 submissions, isAuthor: false
    const otherTeacherRes = await getSubmissionsHandler(new NextRequest('http://localhost:3000/api/submissions?examId=exam-priv-a', {
      headers: { cookie: `azota_token=${userBToken}` }
    }));
    const otherTeacherData = await otherTeacherRes.json();
    expect(otherTeacherData.isAuthor).toBe(false);
    expect(otherTeacherData.submissions.length).toBe(0);

    // Student C queries submissions for Exam A -> sees ONLY own submission, isAuthor: false
    const studentRes = await getSubmissionsHandler(new NextRequest('http://localhost:3000/api/submissions?examId=exam-priv-a', {
      headers: { cookie: `azota_token=${studentCToken}` }
    }));
    const studentData = await studentRes.json();
    expect(studentData.isAuthor).toBe(false);
    expect(studentData.submissions.length).toBe(1);
    expect(studentData.submissions[0].studentName).toBe('Học Sinh C');
  });
});
