import { NextRequest, NextResponse } from 'next/server';
import { examService } from '@/server/examService';

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

    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
