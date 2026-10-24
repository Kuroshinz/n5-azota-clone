import { NextResponse } from 'next/server';
import { examService } from '@/server/examService';

export async function GET() {
  try {
    const exams = await examService.listExams();
    return NextResponse.json({ success: true, exams });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.rawText) {
      const exam = await examService.createExamFromText(body.rawText, {
        title: body.title,
        durationMinutes: body.durationMinutes ? Number(body.durationMinutes) : 45,
      });
      return NextResponse.json({ success: true, exam });
    }

    if (body.exam) {
      await examService.saveExam(body.exam);
      return NextResponse.json({ success: true, exam: body.exam });
    }

    return NextResponse.json({ success: false, error: 'Thiếu rawText hoặc exam payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
