import { NextRequest, NextResponse } from 'next/server';
import { examService } from '@/server/examService';
import { getAuthUser } from '@/server/authService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Exam ID is required' }, { status: 400 });
    }
    const exam = await examService.getExam(id);
    if (!exam) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }

    const currentUser = getAuthUser(request);
    const isAuthorOrAdmin = Boolean(currentUser && (currentUser.userId === exam.authorId || currentUser.role === 'ADMIN'));

    // If exam is private and caller is not the author or admin
    if (exam.isPublic === false && !isAuthorOrAdmin) {
      return NextResponse.json(
        { success: false, error: 'Đề thi này đang ở chế độ riêng tư' },
        { status: 403 }
      );
    }

    // DATA PRIVACY: If caller is NOT the author or admin, sanitize and strictly strip all answers
    if (!isAuthorOrAdmin) {
      const sanitizedQuestions = (exam.questions || []).map(q => {
        const sanitized: any = {
          id: q.id,
          type: q.type,
          rawText: q.rawText,
          content: q.content,
          score: q.score,
          options: q.options || [],
        };

        // For True/False subItems: strip correctAnswer
        if (q.subItems && Array.isArray(q.subItems)) {
          sanitized.subItems = q.subItems.map(item => ({
            key: item.key,
            content: item.content,
          }));
        }

        // Never expose correctAnswer, explanation, or acceptedAnswers
        return sanitized;
      });

      const sanitizedExam = {
        ...exam,
        questions: sanitizedQuestions,
      };

      return NextResponse.json({ success: true, exam: sanitizedExam, isAuthor: false });
    }

    return NextResponse.json({ success: true, exam, isAuthor: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const currentUser = getAuthUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const existing = await examService.getExam(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đề thi' }, { status: 404 });
    }

    // Only author or admin can update the exam
    const isAuthorized = existing.authorId === currentUser.userId || currentUser.role === 'ADMIN';
    if (existing.authorId && !isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền chỉnh sửa đề thi của người khác' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updatedExam = {
      ...existing,
      ...body,
      id,
      authorId: existing.authorId, // preserve author
    };
    await examService.saveExam(updatedExam);
    return NextResponse.json({ success: true, exam: updatedExam });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const currentUser = getAuthUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const existing = await examService.getExam(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đề thi' }, { status: 404 });
    }

    // Only author or admin can delete the exam
    const isAuthorized = existing.authorId === currentUser.userId || currentUser.role === 'ADMIN';
    if (existing.authorId && !isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền xóa đề thi của người khác' },
        { status: 403 }
      );
    }

    const success = await examService.deleteExam(id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Không thể xóa đề thi' }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: 'Đã xóa đề thi thành công' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const currentUser = getAuthUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập để thực hiện' }, { status: 401 });
    }

    const existing = await examService.getExam(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đề thi' }, { status: 404 });
    }

    // Permission: must be author, admin, or exam is public
    const isAuthorized = existing.authorId === currentUser.userId || currentUser.role === 'ADMIN' || existing.isPublic !== false;
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền nhân bản đề thi này' },
        { status: 403 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const newId = `exam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const clonedTitle = body.title ? body.title.trim() : `${existing.title} (Bản sao)`;

    // Deep clone questions
    const clonedQuestions = JSON.parse(JSON.stringify(existing.questions || []));

    const clonedExam: any = {
      ...JSON.parse(JSON.stringify(existing)),
      id: newId,
      title: clonedTitle,
      authorId: currentUser.userId,
      author: {
        id: currentUser.userId,
        fullName: currentUser.fullName,
        phone: (currentUser as any).phone || undefined,
      },
      questions: clonedQuestions,
      createdAt: new Date().toISOString(),
      submissionCount: 0,
      isPublic: existing.isPublic !== undefined ? existing.isPublic : true,
    };

    await examService.saveExam(clonedExam);
    return NextResponse.json({ success: true, exam: clonedExam });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
