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
      const enhancedSubs = await Promise.all(
        mySubs.map(async (sub) => {
          try {
            const ex = await examService.getExam(sub.examId);
            return {
              ...sub,
              examTitle: ex?.title || 'Đề thi trắc nghiệm',
              totalQuestions: ex?.totalQuestions || ex?.questions?.length || 0,
            };
          } catch {
            return { ...sub, examTitle: 'Đề thi trắc nghiệm' };
          }
        })
      );
      return NextResponse.json({ success: true, submissions: enhancedSubs });
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

    // Handle Teacher Test Run / Preview mode (grade without persisting to database/leaderboard)
    if (body.isPreview) {
      const exam = await examService.getExam(body.examId);
      if (!exam) {
        return NextResponse.json({ success: false, error: 'Đề thi không tồn tại' }, { status: 404 });
      }
      const { calculateScore } = await import('@/storage/examStorage');
      const { score, totalScore } = calculateScore(exam, body.answers || {});
      const previewSub = {
        id: `preview-${Date.now()}`,
        examId: body.examId,
        userId: currentUser ? currentUser.userId : null,
        studentName: currentUser ? `${currentUser.fullName} (Giáo viên làm thử)` : 'Giáo viên (Làm thử)',
        studentPhone: null,
        answers: body.answers || {},
        score,
        totalScore,
        submittedAt: new Date().toISOString(),
        proctoringReport: body.proctoringReport || { tabSwitchCount: 0, fullScreenExitCount: 0, violations: [] },
        isPreview: true,
      };
      return NextResponse.json({ success: true, submission: previewSub });
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
