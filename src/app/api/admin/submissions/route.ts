import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/server/prisma';
import { getAuthUser } from '@/server/authService';
import { getSubmissions as getLocalSubmissions, deleteSubmission as deleteLocalSubmission, getExam as getLocalExam } from '@/storage/examStorage';

/**
 * GET /api/admin/submissions
 * Returns submissions with search, proctoring filter, and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền truy cập' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').toLowerCase().trim();
    const violationsOnly = searchParams.get('violations') === 'true';

    if (!isDatabaseConfigured) {
      let localSubs = getLocalSubmissions().map(s => {
        const exam = getLocalExam(s.examId);
        const hasViolation = (s.proctoringReport?.outScreenCount || 0) > 0 || (s.proctoringReport?.fullscreenExitCount || 0) > 0;
        return {
          id: s.id,
          examId: s.examId,
          studentName: s.studentName,
          studentPhone: s.studentPhone || null,
          score: s.score,
          totalScore: s.totalScore,
          submittedAt: s.submittedAt || new Date().toISOString(),
          examTitle: exam?.title || s.examId,
          hasViolation,
          proctoringReport: s.proctoringReport || { outScreenCount: 0, fullscreenExitCount: 0, events: [] },
        };
      });

      if (violationsOnly) {
        localSubs = localSubs.filter(s => s.hasViolation);
      }

      if (query) {
        localSubs = localSubs.filter(s =>
          (s.studentName && s.studentName.toLowerCase().includes(query)) ||
          (s.studentPhone && s.studentPhone.includes(query)) ||
          (s.examTitle && s.examTitle.toLowerCase().includes(query))
        );
      }

      return NextResponse.json({ success: true, submissions: localSubs });
    }

    try {
      const records = await prisma.submission.findMany({
        where: query ? {
          OR: [
            { studentName: { contains: query } },
            { studentPhone: { contains: query } },
            { exam: { title: { contains: query } } }
          ]
        } : undefined,
        orderBy: { submittedAt: 'desc' },
        include: {
          exam: {
            select: { id: true, title: true, durationMinutes: true }
          },
          user: {
            select: { id: true, fullName: true, phone: true }
          }
        }
      });

      const submissions = records.map(s => {
        let proctoringReport: any = { outScreenCount: 0, fullscreenExitCount: 0, events: [] };
        try {
          proctoringReport = JSON.parse(s.proctoringReportJson);
        } catch {}

        const hasViolation = (proctoringReport.outScreenCount || 0) > 0 || (proctoringReport.fullscreenExitCount || 0) > 0;

        return {
          id: s.id,
          examId: s.examId,
          studentName: s.studentName,
          studentPhone: s.studentPhone,
          score: s.score,
          totalScore: s.totalScore,
          submittedAt: s.submittedAt.toISOString(),
          examTitle: s.exam?.title || s.examId,
          hasViolation,
          proctoringReport,
        };
      }).filter(s => violationsOnly ? s.hasViolation : true);

      return NextResponse.json({ success: true, submissions });
    } catch (dbErr: any) {
      console.warn('Prisma DB query failed in /api/admin/submissions, falling back to local submissions:', dbErr.message);

      let localSubs = getLocalSubmissions().map(s => {
        const exam = getLocalExam(s.examId);
        const hasViolation = (s.proctoringReport?.outScreenCount || 0) > 0 || (s.proctoringReport?.fullscreenExitCount || 0) > 0;
        return {
          id: s.id,
          examId: s.examId,
          studentName: s.studentName,
          studentPhone: s.studentPhone || null,
          score: s.score,
          totalScore: s.totalScore,
          submittedAt: s.submittedAt || new Date().toISOString(),
          examTitle: exam?.title || s.examId,
          hasViolation,
          proctoringReport: s.proctoringReport || { outScreenCount: 0, fullscreenExitCount: 0, events: [] },
        };
      });

      if (violationsOnly) {
        localSubs = localSubs.filter(s => s.hasViolation);
      }

      if (query) {
        localSubs = localSubs.filter(s =>
          (s.studentName && s.studentName.toLowerCase().includes(query)) ||
          (s.studentPhone && s.studentPhone.includes(query)) ||
          (s.examTitle && s.examTitle.toLowerCase().includes(query))
        );
      }

      return NextResponse.json({ success: true, submissions: localSubs });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/submissions
 * Deletes a submission
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền thực hiện' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get('id');

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu submissionId' },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured) {
      deleteLocalSubmission(submissionId);
      return NextResponse.json({ success: true, message: 'Đã xóa bài nộp thành công' });
    }

    try {
      await prisma.submission.delete({
        where: { id: submissionId }
      });
      return NextResponse.json({ success: true, message: 'Đã xóa bài nộp thành công' });
    } catch {
      deleteLocalSubmission(submissionId);
      return NextResponse.json({ success: true, message: 'Đã xóa bài nộp thành công' });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
