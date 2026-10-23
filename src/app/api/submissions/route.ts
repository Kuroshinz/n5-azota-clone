import { NextResponse } from 'next/server';
import { examService } from '@/server/examService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const examId = searchParams.get('examId') || undefined;
  const submissions = examService.getSubmissions(examId);
  return NextResponse.json({ success: true, submissions });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const submission = examService.submitExam({
      examId: body.examId,
      studentName: body.studentName,
      answers: body.answers,
      proctoringReport: body.proctoringReport,
    });
    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
