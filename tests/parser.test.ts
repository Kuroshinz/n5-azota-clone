import { describe, it, expect } from 'vitest';
import { normalizeMathFormulas } from '../src/parser/mathConverter';
import { parseExamText } from '../src/parser/examParser';

describe('Math Converter Engine', () => {
  it('converts LaTeX parenthetical delimiters \\( ... \\) to $ ... $ and brackets \\[ ... \\] to $$ ... $$', () => {
    const input = 'Phương trình \\(x^2 - 4 = 0\\) có nghiệm trên \\[x \\in \\mathbb{R}\\]';
    const normalized = normalizeMathFormulas(input);
    expect(normalized).toBe('Phương trình $x^2 - 4 = 0$ có nghiệm trên $$x \\in \\mathbb{R}$$');
  });

  it('preserves existing $...$ and $$...$$ LaTeX formulas', () => {
    const input = 'Hàm số $f(x) = \\frac{1}{x}$ và tích phân $$\\int_0^1 x dx$$';
    const normalized = normalizeMathFormulas(input);
    expect(normalized).toBe(input);
  });
});

describe('Vietnamese Exam Parser Engine', () => {
  it('parses standard 3-question Vietnamese test with A/B/C/D options and inline answer keys', () => {
    const rawExam = `
ĐỀ THI KHẢO SÁT CHẤT LƯỢNG
Câu 1: Thủ đô của Việt Nam là gì?
A. Hà Nội
B. TP. Hồ Chí Minh
C. Đà Nẵng
D. Hải Phòng
Đáp án: A

Câu 2: Số nguyên tố chẵn duy nhất là số nào?
A. 0
B. 1
C. 2
D. 4
Đáp án: C

Câu 3: Đâu là một ngôn ngữ lập trình có kiểu tĩnh?
A. Python
B. HTML
C. CSS
D. TypeScript
Đáp án: D
    `.trim();

    const exam = parseExamText(rawExam, { title: 'Khảo sát chất lượng', durationMinutes: 15 });

    expect(exam.title).toBe('Khảo sát chất lượng');
    expect(exam.durationMinutes).toBe(15);
    expect(exam.totalQuestions).toBe(3);
    expect(exam.questions).toHaveLength(3);

    // Question 1
    expect(exam.questions[0].id).toBe(1);
    expect(exam.questions[0].content).toContain('Thủ đô của Việt Nam là gì?');
    expect(exam.questions[0].options).toHaveLength(4);
    expect(exam.questions[0].options[0]).toEqual({ key: 'A', content: 'Hà Nội' });
    expect(exam.questions[0].options[1]).toEqual({ key: 'B', content: 'TP. Hồ Chí Minh' });
    expect(exam.questions[0].correctAnswer).toBe('A');
    expect(exam.questions[0].score).toBe(3.33);

    // Question 2
    expect(exam.questions[1].id).toBe(2);
    expect(exam.questions[1].correctAnswer).toBe('C');

    // Question 3
    expect(exam.questions[2].id).toBe(3);
    expect(exam.questions[2].correctAnswer).toBe('D');
  });

  it('handles questions containing math formulas and normalizes delimiters', () => {
    const rawExam = `
Câu 1: Cho hàm số \\(f(x) = \\frac{x^2+1}{x-1}\\). Tính đạo hàm $f'(2)$.
A. $f'(2) = 0$
B. $f'(2) = -2$
C. $f'(2) = -3$
D. $f'(2) = 1$
Đáp án: B
    `.trim();

    const exam = parseExamText(rawExam);

    expect(exam.questions).toHaveLength(1);
    expect(exam.questions[0].content).toContain('$f(x) = \\frac{x^2+1}{x-1}$');
    expect(exam.questions[0].content).toContain("$f'(2)$");
    expect(exam.questions[0].options[0].content).toBe("$f'(2) = 0$");
    expect(exam.questions[0].correctAnswer).toBe('B');
  });

  it('detects correct answer marked with asterisk prefix like *A.', () => {
    const rawExam = `
Câu 1: Đâu là công thức định luật II Newton?
*A. $\\vec{F} = m\\vec{a}$
B. $F = mv$
C. $F = ma^2$
D. $F = \\frac{m}{a}$

Bài 2: Kim loại nào dẫn điện tốt nhất?
A. Vàng
*B. Bạc
C. Đồng
D. Nhôm
    `.trim();

    const exam = parseExamText(rawExam);

    expect(exam.questions).toHaveLength(2);
    expect(exam.questions[0].correctAnswer).toBe('A');
    expect(exam.questions[0].options[0].content).toBe('$\\vec{F} = m\\vec{a}$');
    expect(exam.questions[1].correctAnswer).toBe('B');
    expect(exam.questions[1].options[1].content).toBe('Bạc');
  });

  it('parses separate answer key table at the end of the exam', () => {
    const rawExam = `
Câu 1: 1 + 1 bằng bao nhiêu?
A. 1
B. 2
C. 3
D. 4

Câu 2: Mặt trời mọc ở hướng nào?
A. Tây
B. Nam
C. Bắc
D. Đông

Câu 3: $2^3$ bằng:
A. 6
B. 8
C. 9
D. 5

BẢNG ĐÁP ÁN:
1.B  2.D  3.B
    `.trim();

    const exam = parseExamText(rawExam);

    expect(exam.questions).toHaveLength(3);
    expect(exam.questions[0].correctAnswer).toBe('B');
    expect(exam.questions[1].correctAnswer).toBe('D');
    expect(exam.questions[2].correctAnswer).toBe('B');
  });

  it('extracts explanation when provided with Lời giải / Hướng dẫn giải', () => {
    const rawExam = `
Câu 1: Tìm x biết $2x - 6 = 0$.
A. x = 1
B. x = 2
C. x = 3
D. x = 4
Chọn C
Hướng dẫn giải:
Ta có phương trình $2x - 6 = 0 \\Leftrightarrow 2x = 6 \\Leftrightarrow x = 3$.
Vậy nghiệm của phương trình là x = 3.
    `.trim();

    const exam = parseExamText(rawExam);

    expect(exam.questions).toHaveLength(1);
    expect(exam.questions[0].correctAnswer).toBe('C');
    expect(exam.questions[0].explanation).toBeDefined();
    expect(exam.questions[0].explanation).toContain('Ta có phương trình $2x - 6 = 0');
    expect(exam.questions[0].explanation).toContain('nghiệm của phương trình là x = 3.');
  });
});
