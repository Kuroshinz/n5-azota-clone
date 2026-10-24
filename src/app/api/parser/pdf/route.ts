import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdf } from '@/parser/pdfExtractor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy file tải lên' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'File tải lên không phải là định dạng PDF hợp lệ' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await extractTextFromPdf(Buffer.from(arrayBuffer));

    return NextResponse.json({
      success: true,
      text: result.rawText,
      pageCount: result.pageCount,
      questionCount: result.questionCount,
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
    });
  } catch (error: any) {
    console.error('Lỗi khi phân tích file PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Không thể phân tích dữ liệu file PDF',
      },
      { status: 500 }
    );
  }
}
