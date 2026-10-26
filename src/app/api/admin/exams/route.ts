import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/server/prisma';
import { getAuthUser } from '@/server/authService';
import { listExams as listLocalExams, updateExam as updateLocalExam, deleteExam as deleteLocalExam } from '@/storage/examStorage';

/**
 * GET /api/admin/exams
 * Returns all exams across all teachers with search and filter
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
    const examDetailId = searchParams.get('id');
    if (examDetailId) {
      const { examService } = await import('@/server/examService');
      const exam = await examService.getExam(examDetailId);
      if (!exam) {
        return NextResponse.json({ success: false, error: 'Đề thi không tồn tại' }, { status: 404 });
      }
      return NextResponse.json({ success: true, exam });
    }

    const query = (searchParams.get('q') || '').toLowerCase().trim();
    const visibility = searchParams.get('visibility'); // 'public', 'private', or null

    if (!isDatabaseConfigured) {
      let localExams = listLocalExams().map(e => ({
        id: e.id,
        title: e.title,
        durationMinutes: e.durationMinutes,
        totalQuestions: e.totalQuestions || e.questions?.length || 0,
        isPublic: e.isPublic !== undefined ? e.isPublic : true,
        settingsJson: JSON.stringify(e.settings || {}),
        createdAt: e.createdAt || new Date().toISOString(),
        author: {
          id: e.authorId || 'admin-master-root',
          fullName: 'Quản Trị Viên',
          phone: '0999999999',
          email: 'admin@azota.vn'
        },
        _count: { submissions: 0 }
      }));

      if (visibility === 'public') {
        localExams = localExams.filter(e => e.isPublic);
      } else if (visibility === 'private') {
        localExams = localExams.filter(e => !e.isPublic);
      }

      if (query) {
        localExams = localExams.filter(e =>
          e.title.toLowerCase().includes(query) ||
          e.id.toLowerCase().includes(query)
        );
      }

      return NextResponse.json({ success: true, exams: localExams });
    }

    try {
      const exams = await prisma.exam.findMany({
        where: {
          AND: [
            visibility === 'public' ? { isPublic: true } : visibility === 'private' ? { isPublic: false } : {},
            query ? {
              OR: [
                { id: { contains: query } },
                { title: { contains: query } },
                { author: { fullName: { contains: query } } }
              ]
            } : {}
          ]
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          durationMinutes: true,
          totalQuestions: true,
          isPublic: true,
          settingsJson: true,
          createdAt: true,
          author: {
            select: { id: true, fullName: true, phone: true, email: true }
          },
          _count: {
            select: { submissions: true }
          }
        }
      });

      return NextResponse.json({ success: true, exams });
    } catch (dbErr: any) {
      console.warn('Prisma DB query failed in /api/admin/exams, falling back to local exams:', dbErr.message);
      let localExams = listLocalExams().map(e => ({
        id: e.id,
        title: e.title,
        durationMinutes: e.durationMinutes,
        totalQuestions: e.totalQuestions || e.questions?.length || 0,
        isPublic: e.isPublic !== undefined ? e.isPublic : true,
        settingsJson: JSON.stringify(e.settings || {}),
        createdAt: e.createdAt || new Date().toISOString(),
        author: {
          id: e.authorId || 'admin-master-root',
          fullName: 'Quản Trị Viên',
          phone: '0999999999',
          email: 'admin@azota.vn'
        },
        _count: { submissions: 0 }
      }));

      if (visibility === 'public') {
        localExams = localExams.filter(e => e.isPublic);
      } else if (visibility === 'private') {
        localExams = localExams.filter(e => !e.isPublic);
      }

      if (query) {
        localExams = localExams.filter(e =>
          e.title.toLowerCase().includes(query) ||
          e.id.toLowerCase().includes(query)
        );
      }

      return NextResponse.json({ success: true, exams: localExams });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/exams
 * Toggles an exam's visibility (public/private)
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền thực hiện' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { examId, isPublic } = body;

    if (!examId || typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured) {
      const updated = updateLocalExam(examId, { isPublic });
      return NextResponse.json({ success: true, exam: updated || { id: examId, isPublic } });
    }

    try {
      const updated = await prisma.exam.update({
        where: { id: examId },
        data: { isPublic },
        select: { id: true, title: true, isPublic: true }
      });

      return NextResponse.json({ success: true, exam: updated });
    } catch {
      const updated = updateLocalExam(examId, { isPublic });
      return NextResponse.json({ success: true, exam: updated || { id: examId, isPublic } });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/exams
 * Deletes an exam
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
    const examId = searchParams.get('examId');

    if (!examId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu examId' },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured) {
      deleteLocalExam(examId);
      return NextResponse.json({ success: true, message: 'Đã xóa đề thi thành công' });
    }

    try {
      await prisma.exam.delete({
        where: { id: examId }
      });
      return NextResponse.json({ success: true, message: 'Đã xóa đề thi thành công' });
    } catch {
      deleteLocalExam(examId);
      return NextResponse.json({ success: true, message: 'Đã xóa đề thi thành công' });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
