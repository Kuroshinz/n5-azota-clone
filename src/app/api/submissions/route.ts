import { NextRequest, NextResponse } from 'next/server';
import { examService } from '@/server/examService';
import { getAuthUser } from '@/server/authService';

export async function GET(request: NextRequest) {
  try {
    const currentUser = getAuthUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId') || undefined;
    const isMyHistory = searchParams.get('myHistory') === 'true';

    // 1. Student asking for their personal exam history
    if (isMyHistory) {
      const allSubs = await examService.getSubmissions();
      const mySubs = allSubs.filter(s => s.userId === currentUser.userId);
      return NextResponse.json({ success: true, submissions: mySubs });
    }

    // 2. Querying submissions by exam
    if (examId) {
      const exam = await examService.getExam(examId);
      if (!exam) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy đề thi' }, { status: 404 });
      }

      // If caller is the author of the exam: returns all submissions with isAuthor: true
      if (exam.authorId && exam.authorId === currentUser.userId) {
        const submissions = await examService.getSubmissions(examId);
        return NextResponse.json({ success: true, submissions, isAuthor: true });
      }

      // If caller is NOT the author (student or other teacher): returns only their own submissions with isAuthor: false
      const allExamSubs = await examService.getSubmissions(examId);
      const mySubs = allExamSubs.filter(s => s.userId === currentUser.userId);
      return NextResponse.json({ success: true, submissions: mySubs, isAuthor: false });
    }

    // Default: return only current user's personal submissions
    const allSubs = await examService.getSubmissions();
    const mySubs = allSubs.filter(s => s.userId === currentUser.userId);
    return NextResponse.json({ success: true, submissions: mySubs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = getAuthUser(request);
    const body = await request.json();

    if (!body.examId) {
      return NextResponse.json({ success: false, error: 'Mã đề thi không hợp lệ' }, { status: 400 });
    }

    // Accept submission from logged in user or guest student
    const studentName = (currentUser ? currentUser.fullName : (body.studentName && body.studentName.trim())) || 'Học sinh';
    const studentPhone = body.studentPhone || null;
    const userId = currentUser ? currentUser.userId : (body.userId || null);

    const submission = await examService.submitExam({
      examId: body.examId,
      userId,
      studentName,
      studentPhone,
      answers: body.answers,
      proctoringReport: body.proctoringReport,
    });
    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
