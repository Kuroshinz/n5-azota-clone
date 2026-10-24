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
    // If exam is private and caller is not the author
    if (exam.isPublic === false && exam.authorId && exam.authorId !== currentUser?.userId) {
      return NextResponse.json(
        { success: false, error: 'Đề thi này đang ở chế độ riêng tư' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, exam });
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

    // Only author can update the exam
    if (existing.authorId && existing.authorId !== currentUser.userId) {
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

    // Only author can delete the exam
    if (existing.authorId && existing.authorId !== currentUser.userId) {
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
