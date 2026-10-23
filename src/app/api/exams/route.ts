import { NextResponse } from 'next/server';
import { examService } from '@/server/examService';

export async function GET() {
  const exams = examService.listExams();
  return NextResponse.json({ success: true, exams });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.rawText) {
      const exam = examService.createExamFromText(body.rawText, {
        title: body.title,
        durationMinutes: body.durationMinutes ? Number(body.durationMinutes) : 45,
      });
      return NextResponse.json({ success: true, exam });
    }

    if (body.exam) {
      examService.saveExam(body.exam);
      return NextResponse.json({ success: true, exam: body.exam });
    }

    return NextResponse.json({ success: false, error: 'Thiếu rawText hoặc exam payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
