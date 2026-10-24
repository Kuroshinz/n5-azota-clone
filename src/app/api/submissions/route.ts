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

    // 2. Querying submissions by exam: ONLY the author of the exam has permission
    if (examId) {
      const exam = await examService.getExam(examId);
      if (!exam) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy đề thi' }, { status: 404 });
      }

      if (exam.authorId && exam.authorId !== currentUser.userId) {
        return NextResponse.json(
          { success: false, error: 'Chỉ tác giả đề thi mới có quyền xem danh sách bài nộp của đề thi này' },
          { status: 403 }
        );
      }

      const submissions = await examService.getSubmissions(examId);
      return NextResponse.json({ success: true, submissions, isAuthor: true });
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
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập trước khi nộp bài' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const submission = await examService.submitExam({
      examId: body.examId,
      userId: currentUser.userId,
      studentName: currentUser.fullName,
      studentPhone: body.studentPhone || null,
      answers: body.answers,
      proctoringReport: body.proctoringReport,
    });
    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
