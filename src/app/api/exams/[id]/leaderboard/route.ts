import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/server/prisma';
import { examService } from '@/server/examService';
import { getSubmissions as getLocalSubmissions } from '@/storage/examStorage';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: examId } = params;
    if (!examId) {
      return NextResponse.json({ success: false, error: 'Thiếu mã đề thi' }, { status: 400 });
    }

    // Verify exam existence and get title
    const exam = await examService.getExam(examId);
    if (!exam) {
      return NextResponse.json({ success: false, error: 'Đề thi không tồn tại' }, { status: 404 });
    }

    let rawSubmissions: any[] = [];

    if (isDatabaseConfigured) {
      try {
        rawSubmissions = await prisma.submission.findMany({
          where: { examId },
          orderBy: [
            { score: 'desc' },
            { submittedAt: 'asc' }
          ],
          select: {
            id: true,
            studentName: true,
            score: true,
            totalScore: true,
            submittedAt: true,
          }
        });
      } catch {
        rawSubmissions = getLocalSubmissions()
          .filter(s => s.examId === examId)
          .sort((a, b) => b.score - a.score || new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
      }
    } else {
      rawSubmissions = getLocalSubmissions()
        .filter(s => s.examId === examId)
        .sort((a, b) => b.score - a.score || new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    }

    // Calculate rank and strictly omit any phone number or sensitive student identifiers
    let currentRank = 1;
    const leaderboard = rawSubmissions.map((sub, index) => {
      // If score is equal to previous, they share the rank; otherwise rank is index + 1
      if (index > 0 && sub.score < rawSubmissions[index - 1].score) {
        currentRank = index + 1;
      }

      return {
        rank: currentRank,
        id: sub.id,
        studentName: sub.studentName || 'Thí sinh',
        score: sub.score,
        totalScore: sub.totalScore || 10,
        submittedAt: typeof sub.submittedAt === 'string' ? sub.submittedAt : sub.submittedAt?.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        totalQuestions: exam.totalQuestions,
      },
      totalParticipants: leaderboard.length,
      leaderboard,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
