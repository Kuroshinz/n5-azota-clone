import { NextRequest, NextResponse } from 'next/server';
import { examService } from '@/server/examService';
import { getAuthUser, isAdminOrOwner } from '@/server/authService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu mã bài nộp' }, { status: 400 });
    }

    const submission = await examService.getSubmission(id);
    if (!submission) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài nộp' }, { status: 404 });
    }

    const exam = await examService.getExam(submission.examId);
    const currentUser = getAuthUser(request);

    const isAuthorOrAdmin = Boolean(
      currentUser && (currentUser.userId === exam?.authorId || isAdminOrOwner(currentUser))
    );
    const isOwnerStudent = Boolean(
      currentUser && submission.userId && currentUser.userId === submission.userId
    );

    const showPolicy = exam?.settings?.showResultAfterSubmit || 'score_and_answers';

    // If teacher or admin is reviewing: always provide full exam and review
    if (isAuthorOrAdmin) {
      return NextResponse.json({
        success: true,
        submission,
        exam,
        showPolicy,
        isAuthor: true,
      });
    }

    // For students or public reviewers
    if (showPolicy === 'hidden') {
      return NextResponse.json({
        success: true,
        submission: {
          id: submission.id,
          examId: submission.examId,
          studentName: submission.studentName,
          submittedAt: submission.submittedAt,
          score: 0,
          totalScore: submission.totalScore,
          answers: {},
          proctoringReport: submission.proctoringReport,
        },
        exam: exam ? { id: exam.id, title: exam.title, durationMinutes: exam.durationMinutes, totalQuestions: exam.totalQuestions, questions: [] } : null,
        showPolicy: 'hidden',
        isScoreHidden: true,
        message: 'Giáo viên chưa công bố điểm số và đáp án bài thi này.',
        isAuthor: false,
      });
    }

    if (showPolicy === 'score_only') {
      return NextResponse.json({
        success: true,
        submission: {
          id: submission.id,
          examId: submission.examId,
          studentName: submission.studentName,
          submittedAt: submission.submittedAt,
          score: submission.score,
          totalScore: submission.totalScore,
          answers: submission.answers,
          proctoringReport: submission.proctoringReport,
        },
        exam: exam ? {
          ...exam,
          questions: (exam.questions || []).map(q => ({
            id: q.id,
            type: q.type,
            rawText: q.rawText,
            content: q.content,
            score: q.score,
            options: q.options || [],
          })),
        } : null,
        showPolicy: 'score_only',
        isAnswersHidden: true,
        isAuthor: false,
      });
    }

    // Default: 'score_and_answers'
    return NextResponse.json({
      success: true,
      submission,
      exam,
      showPolicy: 'score_and_answers',
      isAuthor: false,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
