import { NextRequest, NextResponse } from 'next/server';
import { examService } from '@/server/examService';
import { getAuthUser, isAdminOrOwner } from '@/server/authService';

export async function GET(request: NextRequest) {
  try {
    const currentUser = getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const isPublicQuery = searchParams.get('public') === 'true';

    // 1. Authenticated user viewing their own exam dashboard (Strict Isolation)
    if (currentUser && !isPublicQuery) {
      if (searchParams.get('all') === 'true' && isAdminOrOwner(currentUser)) {
        const exams = await examService.listExams();
        return NextResponse.json({ success: true, exams });
      }
      const exams = await examService.listExams(currentUser.userId);
      return NextResponse.json({ success: true, exams });
    }

    // 2. Unauthenticated visitors, guests, and public browsing: return public exams & demo templates
    const allExams = await examService.listExams();
    const publicExams = allExams.filter(e => e.isPublic !== false);
    return NextResponse.json({ success: true, exams: publicExams });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = getAuthUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để tạo đề thi' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const authorId = currentUser.userId;

    if (body.rawText) {
      const exam = await examService.createExamFromText(body.rawText, {
        title: body.title,
        durationMinutes: body.durationMinutes ? Number(body.durationMinutes) : 45,
        settings: body.settings,
        authorId,
        isPublic: body.isPublic !== undefined ? Boolean(body.isPublic) : true,
      });
      return NextResponse.json({ success: true, exam });
    }

    const targetExam = body.exam || (body.id && body.title && body.questions ? body : null);

    if (targetExam) {
      const targetId = targetExam.id;
      let existing = null;
      if (targetId) {
        existing = await examService.getExam(targetId);
        if (existing && existing.authorId && existing.authorId !== authorId && !isAdminOrOwner(currentUser)) {
          return NextResponse.json(
            { success: false, error: 'Bạn không có quyền chỉnh sửa đề thi của người khác' },
            { status: 403 }
          );
        }
      }

      if (existing && existing.authorId && isAdminOrOwner(currentUser)) {
        targetExam.authorId = existing.authorId;
      } else {
        targetExam.authorId = authorId;
      }
      if (targetExam.isPublic === undefined) targetExam.isPublic = true;
      await examService.saveExam(targetExam);
      return NextResponse.json({ success: true, exam: targetExam });
    }

    return NextResponse.json({ success: false, error: 'Thiếu rawText hoặc exam payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
