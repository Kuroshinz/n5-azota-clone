import { describe, it, expect } from 'vitest';
import { cleanPdfExamText, normalizePdfInlineChoices, extractTextFromPdf } from '../src/parser/pdfExtractor';

describe('PDF Exam Extractor & Text Cleaner', () => {
  it('normalizes inline options A, B, C, D separated by spaces or tabs onto new lines', () => {
    const raw = `Câu 1: Nghiệm của phương trình là gì?
A. x = 1    B. x = 2    C. x = 3    D. x = 4
Câu 2: Giá trị vận tốc?
*A. 300 m/s\tB. 400 m/s\tC. 500 m/s\tD. 600 m/s`;

    const normalized = normalizePdfInlineChoices(raw);
    expect(normalized).toContain('A. x = 1\nB. x = 2\nC. x = 3\nD. x = 4');
    expect(normalized).toContain('*A. 300 m/s\nB. 400 m/s\nC. 500 m/s\nD. 600 m/s');
  });

  it('normalizes bracketed and colon options (A), [A], A:', () => {
    const raw = `Câu 1: Lựa chọn đúng?
(A) Đúng      (B) Sai      (C) Không rõ      (D) Khác
Câu 2: Kết quả?
[A] 10        [B] 20        [C] 30        [D] 40`;

    const normalized = normalizePdfInlineChoices(raw);
    expect(normalized).toContain('(A) Đúng\n(B) Sai\n(C) Không rõ\n(D) Khác');
    expect(normalized).toContain('[A] 10\n[B] 20\n[C] 30\n[D] 40');
  });

  it('cleans pagination artifacts, exam metadata noise and normalizes headers', () => {
    const raw = `SỞ GD&ĐT HÀ NỘI
MÃ ĐỀ: 101
Họ, tên thí sinh: Nguyễn Văn A
Số báo danh: 123456
Trang 1/4
[Câu 1]. Cho hàm số y = f(x).
A. 1
B. 2
- 1 -
Câu 2 - Tìm đạo hàm.
Trang 2/4
--- HẾT ---
Thí sinh không được sử dụng tài liệu`;

    const cleaned = cleanPdfExamText(raw);
    expect(cleaned).not.toContain('Trang 1/4');
    expect(cleaned).not.toContain('Trang 2/4');
    expect(cleaned).not.toContain('- 1 -');
    expect(cleaned).not.toContain('MÃ ĐỀ: 101');
    expect(cleaned).not.toContain('Nguyễn Văn A');
    expect(cleaned).not.toContain('HẾT');
    expect(cleaned).toContain('Câu 1: ');
    expect(cleaned).toContain('Câu 2: ');
  });

  it('normalizes standalone numbers like "1. Cho hàm số..." into "Câu 1: "', () => {
    const raw = `1. Cho hàm số f(x) liên tục trên R.
A. 1
B. 2
2. Giá trị nhỏ nhất của biểu thức là:
A. 0
B. 5`;

    const cleaned = cleanPdfExamText(raw);
    expect(cleaned).toContain('Câu 1: Cho hàm số');
    expect(cleaned).toContain('Câu 2: Giá trị nhỏ nhất');
  });

  it('extracts text from valid PDF buffer', async () => {
    // Minimal PDF 1.4 binary structure
    const minimalPdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 300 144]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000057 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF';
    const buffer = Buffer.from(minimalPdf);

    let progressCalled = false;
    const result = await extractTextFromPdf(buffer, (step) => {
      progressCalled = true;
    });
    expect(result.pageCount).toBe(1);
    expect(typeof result.rawText).toBe('string');
    expect(progressCalled).toBe(true);
  });
});
