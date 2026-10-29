import { describe, it, expect } from 'vitest';
import { parseExamText, normalizeExamQuestions } from '../src/parser/examParser';
import { normalizeInlineChoices } from '../src/parser/wordExtractor';
import { normalizePdfInlineChoices } from '../src/parser/pdfExtractor';

describe('Exam Parser Bio & Chemistry Edge Cases (Bio Exam 1792848004084)', () => {
  it('correctly parses Question 33 without empty B option or split A/D options when text mentions cây A và B', () => {
    const rawText = `Câu 33: (ID: 596618799) TH. Người ta tiến hành thí nghiệm trồng hai cây A và B trong một nhà kính. Khi tăng cường độ chiếu sáng và tăng nhiệt độ trong nhà kính thì cường độ quang hợp của cây A giảm, nhưng cường độ quang hợp của cây B tăng. Mục đích chính thí nghiệm là
A. đo cường độ quang hợp của 2 cây A và B.
B. nhận biết cây C3 và cây C4.
C. nhận biết cây C4 và cây CAM.
D. đo cường độ hô hấp của 2 cây A và B.`;

    const exam = parseExamText(rawText);
    expect(exam.questions).toHaveLength(1);
    const q = exam.questions[0];

    expect(q.type).toBe('multiple_choice');
    expect(q.options).toHaveLength(4);
    expect(q.options?.map(o => o.key)).toEqual(['A', 'B', 'C', 'D']);

    expect(q.options?.[0].content).toContain('của 2 cây A và B');
    expect(q.options?.[1].content).not.toMatch(/^B\./);
    expect(q.options?.[1].content).toContain('nhận biết cây C3 và cây C4');
    expect(q.options?.[2].content).toContain('nhận biết cây C4 và cây CAM');
    expect(q.options?.[3].content).toContain('của 2 cây A và B');
  });

  it('correctly parses Question 64 with table/list of ion A, B, C without creating 8 broken options', () => {
    const rawText = `Câu 64: (ID: 596618730) TH. Các nguyên tố khoáng trong môi trường đất và rễ sau đây:
• Loại ion khoáng A: Môi trường đất = 0,01M | Trong rễ (tế bào lông hút) = 0,02M
• Loại ion khoáng B: Môi trường đất = 0,03M | Trong rễ (tế bào lông hút) = 0,05M
• Loại ion khoáng C: Môi trường đất = 0,04M | Trong rễ (tế bào lông hút) = 0,004M
Cây không cần A, cần B và C. Phát biểu nào sau đây đúng?
A. A được hấp thụ chủ động.
B. A được hấp thụ bị động.
C. B được hấp thụ bị động.
D. C được hấp thụ thụ động.`;

    const exam = parseExamText(rawText);
    expect(exam.questions).toHaveLength(1);
    const q = exam.questions[0];

    expect(q.content).toContain('Loại ion khoáng A');
    expect(q.content).toContain('Loại ion khoáng B');
    expect(q.content).toContain('Phát biểu nào sau đây đúng?');

    expect(q.options).toHaveLength(4);
    expect(q.options?.map(o => o.key)).toEqual(['A', 'B', 'C', 'D']);
    expect(q.options?.[0].content).toBe('A được hấp thụ chủ động.');
    expect(q.options?.[1].content).toBe('A được hấp thụ bị động.');
    expect(q.options?.[2].content).toBe('B được hấp thụ bị động.');
    expect(q.options?.[3].content).toBe('C được hấp thụ thụ động.');
  });

  it('normalizes legacy or malformed exam questions with normalizeExamQuestions', () => {
    const malformedQuestion = {
      id: 33,
      type: 'multiple_choice' as const,
      rawText: '',
      content: 'Người ta trồng hai cây A và B...',
      options: [
        { key: 'B' as const, content: '   ' },
        { key: 'C' as const, content: 'nhận biết cây C4 và cây CAM.' },
        { key: 'B' as const, content: 'B. nhận biết cây C3 và cây C4.' },
        { key: 'D' as const, content: 'đo cường độ hô hấp của 2 cây A và' },
        { key: 'A' as const, content: 'đo cường độ quang hợp của 2 cây A và' },
      ],
      score: 0.25,
    };

    const normalized = normalizeExamQuestions([malformedQuestion]);
    expect(normalized).toHaveLength(1);
    const q = normalized[0];

    expect(q.options).toHaveLength(4);
    expect(q.options?.map(o => o.key)).toEqual(['A', 'B', 'C', 'D']);
    expect(q.options?.every(o => o.content.trim().length > 0)).toBe(true);
    expect(q.options?.some(o => /^B\./.test(o.content))).toBe(false);
  });
  it('preserves isolated letter mentions in Word extractor without splitting lines', () => {
    const lineWithIsolatedLetters = 'đo cường độ quang hợp của 2 cây A và B.';
    const normalized = normalizeInlineChoices(lineWithIsolatedLetters);
    expect(normalized).toBe(lineWithIsolatedLetters);
  });

  it('preserves isolated letter mentions in PDF extractor without splitting lines', () => {
    const lineWithIon = '• Loại ion khoáng A: Môi trường đất = 0,01M | Trong rễ = 0,02M';
    const normalized = normalizePdfInlineChoices(lineWithIon);
    expect(normalized).toBe(lineWithIon);
  });

  it('correctly splits inline options when at least 2 distinct options exist on the line', () => {
    const inlineLine = 'A. 12 m/s    B. 15 m/s    C. 20 m/s    D. 25 m/s';
    const normalizedWord = normalizeInlineChoices(inlineLine);
    expect(normalizedWord.split('\n')).toHaveLength(4);

    const normalizedPdf = normalizePdfInlineChoices(inlineLine);
    expect(normalizedPdf.split('\n')).toHaveLength(4);
  });
});
