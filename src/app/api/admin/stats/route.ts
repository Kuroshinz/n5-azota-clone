import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/server/prisma';
import { getAuthUser } from '@/server/authService';
import { listExams as listLocalExams, getSubmissions as getLocalSubmissions } from '@/storage/examStorage';

/**
 * GET /api/admin/stats
 * Returns overall statistics for the system dashboard (resilient to missing DATABASE_URL)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'OWNER')) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền truy cập trang quản trị' },
        { status: 403 }
      );
    }

    if (!isDatabaseConfigured) {
      // Local fallback mode when DATABASE_URL is not set
      const localExams = listLocalExams();
      const localSubs = getLocalSubmissions();

      let violationCount = 0;
      localSubs.forEach(s => {
        if ((s.proctoringReport?.outScreenCount || 0) > 0 || (s.proctoringReport?.fullscreenExitCount || 0) > 0) {
          violationCount++;
        }
      });

      return NextResponse.json({
        success: true,
        stats: {
          totalUsers: 1, // Super Admin
          totalExams: localExams.length,
          totalSubmissions: localSubs.length,
          violationCount,
        },
        recent: {
          users: [
            {
              id: 'admin-master-root',
              fullName: 'Quản Trị Viên (Admin Master)',
              phone: '0999999999',
              email: 'admin@azota.vn',
              role: 'ADMIN',
              createdAt: new Date().toISOString()
            }
          ],
          exams: localExams.slice(0, 5),
          submissions: localSubs.slice(0, 5)
        }
      });
    }

    try {
      const [totalUsers, totalExams, totalSubmissions, recentUsers, recentExams, recentSubmissions] = await Promise.all([
        prisma.user.count(),
        prisma.exam.count(),
        prisma.submission.count(),
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, fullName: true, phone: true, email: true, role: true, createdAt: true }
        }),
        prisma.exam.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, isPublic: true, totalQuestions: true, durationMinutes: true, createdAt: true, author: { select: { fullName: true } } }
        }),
        prisma.submission.findMany({
          take: 5,
          orderBy: { submittedAt: 'desc' },
          select: { id: true, studentName: true, score: true, totalScore: true, submittedAt: true, exam: { select: { id: true, title: true } } }
        })
      ]);

      const submissions = await prisma.submission.findMany({
        select: { proctoringReportJson: true }
      });
      let violationCount = 0;
      submissions.forEach(s => {
        try {
          const parsed = JSON.parse(s.proctoringReportJson);
          if ((parsed.outScreenCount || 0) > 0 || (parsed.fullscreenExitCount || 0) > 0) {
            violationCount++;
          }
        } catch {}
      });

      return NextResponse.json({
        success: true,
        stats: {
          totalUsers,
          totalExams,
          totalSubmissions,
          violationCount,
        },
        recent: {
          users: recentUsers,
          exams: recentExams,
          submissions: recentSubmissions
        }
      });
    } catch (dbErr: any) {
      console.warn('Prisma DB query failed in /api/admin/stats, falling back to local storage:', dbErr.message);

      const localExams = listLocalExams();
      const localSubs = getLocalSubmissions();

      let violationCount = 0;
      localSubs.forEach(s => {
        if ((s.proctoringReport?.outScreenCount || 0) > 0 || (s.proctoringReport?.fullscreenExitCount || 0) > 0) {
          violationCount++;
        }
      });

      return NextResponse.json({
        success: true,
        stats: {
          totalUsers: 1,
          totalExams: localExams.length,
          totalSubmissions: localSubs.length,
          violationCount,
        },
        recent: {
          users: [
            {
              id: 'admin-master-root',
              fullName: 'Quản Trị Viên (Admin Master)',
              phone: '0999999999',
              email: 'admin@azota.vn',
              role: 'ADMIN',
              createdAt: new Date().toISOString()
            }
          ],
          exams: localExams.slice(0, 5),
          submissions: localSubs.slice(0, 5)
        }
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
