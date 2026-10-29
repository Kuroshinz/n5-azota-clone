import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/server/prisma';
import { getAuthUser } from '@/server/authService';
import { listExams as listLocalExams, updateExam as updateLocalExam, deleteExam as deleteLocalExam, getSubmissions as getLocalSubmissions } from '@/storage/examStorage';

/**
 * GET /api/admin/exams
 * Returns all exams across all teachers or single exam detail / analytics
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
    const isAnalytics = searchParams.get('analytics') === 'true';

    if (examDetailId) {
      const { examService } = await import('@/server/examService');
      const exam = await examService.getExam(examDetailId);
      if (!exam) {
        return NextResponse.json({ success: false, error: 'Đề thi không tồn tại' }, { status: 404 });
      }

      if (isAnalytics) {
        let subs: any[] = [];
        if (isDatabaseConfigured) {
          try {
            subs = await prisma.submission.findMany({
              where: { examId: examDetailId },
              select: {
                id: true,
                score: true,
                totalScore: true,
                answersJson: true,
                submittedAt: true,
              }
            });
          } catch {
            subs = getLocalSubmissions().filter(s => s.examId === examDetailId);
          }
        } else {
          subs = getLocalSubmissions().filter(s => s.examId === examDetailId);
        }

        const totalSubmissions = subs.length;
        const scores = subs.map(s => Number(s.score) || 0);
        const averageScore = totalSubmissions > 0
          ? Number((scores.reduce((a, b) => a + b, 0) / totalSubmissions).toFixed(2))
          : 0;
        const highestScore = totalSubmissions > 0 ? Math.max(...scores) : 0;
        const lowestScore = totalSubmissions > 0 ? Math.min(...scores) : 0;

        // Score Distribution: 0-2, 2-4, 4-6, 6-8, 8-10
        const scoreDistribution = {
          '0-2': scores.filter(s => s >= 0 && s < 2).length,
          '2-4': scores.filter(s => s >= 2 && s < 4).length,
          '4-6': scores.filter(s => s >= 4 && s < 6).length,
          '6-8': scores.filter(s => s >= 6 && s < 8).length,
          '8-10': scores.filter(s => s >= 8 && s <= 10).length,
        };

        // Per-question accuracy analytics
        const questions = exam.questions || [];
        const questionStats = questions.map((q: any, idx: number) => {
          let correctCount = 0;
          let answeredCount = 0;

          for (const s of subs) {
            let answers: Record<string, any> = {};
            if (typeof s.answersJson === 'string') {
              try { answers = JSON.parse(s.answersJson); } catch {}
            } else if (s.answers) {
              answers = s.answers;
            }

            const studentAns = answers[q.id];
            if (studentAns !== undefined && studentAns !== null && studentAns !== '') {
              answeredCount++;
              if (q.type === 'multiple_choice') {
                if (studentAns === q.correctAnswer) correctCount++;
              } else if (q.type === 'short_answer') {
                const cleanAns = String(studentAns).trim().toLowerCase();
                const matched = (q.acceptedAnswers || []).some(
                  (acc: string) => acc.trim().toLowerCase() === cleanAns
                );
                if (matched) correctCount++;
              } else if (q.type === 'true_false') {
                if (typeof studentAns === 'object' && q.subItems && Array.isArray(q.subItems)) {
                  const allMatch = q.subItems.every((item: any) => studentAns[item.key] === item.correctAnswer);
                  if (allMatch) correctCount++;
                }
              }
            }
          }

          const accuracy = totalSubmissions > 0
            ? Math.round((correctCount / totalSubmissions) * 100)
            : 0;
          const wrongCount = totalSubmissions - correctCount;

          return {
            questionId: q.id,
            displayNumber: idx + 1,
            type: q.type,
            content: q.content,
            correctCount,
            wrongCount,
            accuracy,
            isDifficult: totalSubmissions >= 2 && accuracy < 50,
          };
        });

        return NextResponse.json({
          success: true,
          exam,
          analytics: {
            totalSubmissions,
            averageScore,
            highestScore,
            lowestScore,
            scoreDistribution,
            questionStats,
          }
        });
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
        _count: { submissions: getLocalSubmissions().filter(s => s.examId === e.id).length }
      }));

      if (visibility === 'public') {
        localExams = localExams.filter(e => e.isPublic);
      } else if (visibility === 'private') {
        localExams = localExams.filter(e => !e.isPublic);
      }

      if (query) {
        localExams = localExams.filter(e =>
          e.title.toLowerCase().includes(query) ||
          e.id.toLowerCase().includes(query) ||
          (e.author?.fullName && e.author.fullName.toLowerCase().includes(query))
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
        _count: { submissions: getLocalSubmissions().filter(s => s.examId === e.id).length }
      }));

      if (visibility === 'public') {
        localExams = localExams.filter(e => e.isPublic);
      } else if (visibility === 'private') {
        localExams = localExams.filter(e => !e.isPublic);
      }

      if (query) {
        localExams = localExams.filter(e =>
          e.title.toLowerCase().includes(query) ||
          e.id.toLowerCase().includes(query) ||
          (e.author?.fullName && e.author.fullName.toLowerCase().includes(query))
        );
      }

      return NextResponse.json({ success: true, exams: localExams });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/exams
 * Clone / Duplicate Exam
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền thực hiện' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, examId } = body;

    if (action === 'bulk_delete') {
      const { examIds } = body;
      if (!Array.isArray(examIds) || examIds.length === 0) {
        return NextResponse.json({ success: false, error: 'Thiếu danh sách examIds' }, { status: 400 });
      }
      const { examService } = await import('@/server/examService');
      let count = 0;
      for (const id of examIds) {
        try {
          await examService.deleteExam(id);
          count++;
        } catch {}
      }
      return NextResponse.json({ success: true, message: `Đã xóa thành công ${count} đề thi đã chọn` });
    }

    if (action === 'bulk_visibility') {
      const { examIds, isPublic } = body;
      if (!Array.isArray(examIds) || typeof isPublic !== 'boolean') {
        return NextResponse.json({ success: false, error: 'Dữ liệu không hợp lệ' }, { status: 400 });
      }
      const { examService } = await import('@/server/examService');
      let count = 0;
      for (const id of examIds) {
        try {
          const ex = await examService.getExam(id);
          if (ex) {
            await examService.saveExam({ ...ex, isPublic });
            count++;
          }
        } catch {}
      }
      return NextResponse.json({ success: true, message: `Đã cập nhật trạng thái cho ${count} đề thi` });
    }

    if (action === 'clone') {
      if (!examId) {
        return NextResponse.json({ success: false, error: 'Thiếu mã examId cần nhân bản' }, { status: 400 });
      }

      const { examService } = await import('@/server/examService');
      const original = await examService.getExam(examId);
      if (!original) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy đề thi gốc' }, { status: 404 });
      }

      const newId = 'exam-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      const cloned = {
        ...original,
        id: newId,
        title: '[Bản sao] ' + original.title,
        isPublic: false, // Default private for admin review
        createdAt: new Date().toISOString(),
        authorId: original.authorId || auth.userId,
      };

      await examService.saveExam(cloned);
      return NextResponse.json({
        success: true,
        message: 'Đã nhân bản đề thi thành công',
        exam: cloned,
      });
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/exams
 * Quick Edit exam metadata & Reassign author
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền thực hiện' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { examId, title, durationMinutes, isPublic, settings, authorId } = body;

    if (!examId) {
      return NextResponse.json({ success: false, error: 'Thiếu examId' }, { status: 400 });
    }

    const { examService } = await import('@/server/examService');
    const existing = await examService.getExam(examId);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đề thi' }, { status: 404 });
    }

    const updated = {
      ...existing,
      title: title !== undefined ? String(title).trim() : existing.title,
      durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : existing.durationMinutes,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : existing.isPublic,
      authorId: authorId !== undefined ? authorId : existing.authorId,
      settings: settings !== undefined ? { ...existing.settings, ...settings } : existing.settings,
    };

    await examService.saveExam(updated);
    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin đề thi thành công',
      exam: updated,
    });
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
