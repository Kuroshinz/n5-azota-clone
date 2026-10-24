import { PDFParse } from 'pdf-parse';
import { parseExamText } from './examParser';

export interface ExtractedPdfResult {
  rawText: string;
  pageCount: number;
  questionCount: number;
}

/**
 * Normalizes inline options (e.g., "A. 1   B. 2   C. 3   D. 4" or "*A. 1  B. 2")
 * into distinct newlines so that line-based question parsers can reliably match them.
 */
export function normalizePdfInlineChoices(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => {
      // Split on 2+ spaces or tabs if followed by an option indicator like B., C., D. or *B., *C., *D.
      let result = line
        .replace(/(?:\t+|\s{2,})(\*?[A-D][.:\)])(?=\s+)/g, '\n$1')
        .replace(/(?:\t+|\s{2,})(\*?[a-d][.:\)])(?=\s+)/g, '\n$1');
      return result;
    })
    .join('\n');
}

/**
 * Cleans PDF text artifacts such as headers, footers, page numbering,
 * standalone pagination, ligatures, and extra whitespace.
 */
export function cleanPdfExamText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Normalize unicode ligatures and special quotes/dashes
  text = text
    .replace(/\uFB01/g, 'fi')
    .replace(/\uFB02/g, 'fl')
    .replace(/\uFB00/g, 'ff')
    .replace(/\uFB03/g, 'ffi')
    .replace(/\uFB04/g, 'ffl')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-');

  // 2. Remove common PDF header/footer and page number patterns
  const lines = text.split(/\r?\n/);
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;

    // Filter out: "Trang 1/5", "Trang 1", "Page 1 of 5", "- 1 -"
    if (/^Trang\s+\d+(\s*\/\s*\d+)?$/i.test(trimmed)) return false;
    if (/^Page\s+\d+(\s+of\s+\d+)?$/i.test(trimmed)) return false;
    if (/^-\s*\d+\s*-$/.test(trimmed)) return false;

    // Filter out lone "--- HẾT ---" or "BỘ GIÁO DỤC VÀ ĐÀO TẠO" if standalone
    if (/^[-=*~_\s]*H[EẾ]T[-=*~_\s]*$/i.test(trimmed)) return false;

    return true;
  });

  text = filteredLines.join('\n');

  // 3. Normalize Câu / Bài headers (e.g. "CÂU 1.", "Câu 1 :", "Bài 1.")
  text = text.replace(/(?:^|\n)(?:C[AÂ]U|B[AÀ]I)\s*(\d+)[\s.:]+/gi, '\nCâu $1: ');

  // 4. Normalize inline options (A, B, C, D on the same line)
  text = normalizePdfInlineChoices(text);

  // 5. Clean up excessive consecutive blank lines (limit to max 2)
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

/**
 * Extracts raw text from a PDF Buffer or ArrayBuffer, performs intelligent cleaning,
 * and counts detected questions.
 */
export async function extractTextFromPdf(
  buffer: ArrayBuffer | Buffer | Uint8Array
): Promise<ExtractedPdfResult> {
  try {
    const uint8Data =
      buffer instanceof Uint8Array
        ? buffer
        : buffer instanceof ArrayBuffer
        ? new Uint8Array(buffer)
        : new Uint8Array(buffer);

    const parser = new PDFParse({ data: uint8Data });
    const result = await parser.getText();
    const pageCount = result.total || result.pages?.length || 1;

    // Clean up memory
    await parser.destroy();

    const cleanedText = cleanPdfExamText(result.text || '');

    // Estimate number of recognized questions using examParser
    const parsed = parseExamText(cleanedText);
    const questionCount = parsed.questions ? parsed.questions.length : 0;

    return {
      rawText: cleanedText,
      pageCount,
      questionCount,
    };
  } catch (err: any) {
    console.error('Lỗi khi trích xuất PDF:', err);
    throw new Error(`Không thể trích xuất nội dung từ file PDF: ${err.message || 'Lỗi không xác định'}`);
  }
}
