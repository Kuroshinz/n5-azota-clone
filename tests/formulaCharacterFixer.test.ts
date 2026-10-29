import { describe, it, expect } from 'vitest';
import katex from 'katex';
import {
  formatChemicalFormula,
  sanitizeLatexFormula,
  normalizeMathFormulas,
  hasFormulaOrCharacterIssue,
  fixQuestionFormulaErrors,
  fixExamQuestionsCharacters,
} from '../src/parser/mathConverter';
import { Question } from '../src/types/exam';

describe('Formula & Character Fixer (Resolving KaTeX \\text{CO_2} parse errors)', () => {
  it('formats chemical formulas with subscript in \\mathrm{...}', () => {
    expect(formatChemicalFormula('CO2')).toBe('\\mathrm{CO_2}');
    expect(formatChemicalFormula('O2')).toBe('\\mathrm{O_2}');
    expect(formatChemicalFormula('H2SO4')).toBe('\\mathrm{H_2SO_4}');
    expect(formatChemicalFormula('Ca(OH)2')).toBe('\\mathrm{Ca(OH)_2}');
  });

  it('sanitizes broken \\text{CO_2} and \\text{O_2} into valid KaTeX markup', () => {
    const broken1 = '\\text{CO_2}';
    const broken2 = '\\text{O_2}';

    // Original KaTeX throws on broken \\text{..._...} formulas
    expect(() => katex.renderToString(broken1, { throwOnError: true })).toThrow();
    expect(() => katex.renderToString(broken2, { throwOnError: true })).toThrow();

    // Sanitized formulas render successfully
    const clean1 = sanitizeLatexFormula(broken1);
    const clean2 = sanitizeLatexFormula(broken2);

    expect(clean1).toBe('\\mathrm{CO_2}');
    expect(clean2).toBe('\\mathrm{O_2}');

    expect(() => katex.renderToString(clean1, { throwOnError: true })).not.toThrow();
    expect(() => katex.renderToString(clean2, { throwOnError: true })).not.toThrow();
  });

  it('fixes the exact user screenshot text in Option D and explanation', () => {
    // Exact Option D from screenshot:
    const optionText = 'Sinh vật quang tự dưỡng có khả năng hấp thụ $\\text{CO_2}$';
    const fixedOption = normalizeMathFormulas(optionText);
    expect(fixedOption).toBe('Sinh vật quang tự dưỡng có khả năng hấp thụ $\\mathrm{CO_2}$');

    // Exact explanation from screenshot (unwrapped raw \\text{CO_2} and \\text{O_2}):
    const explanationText =
      'Sinh vật quang tự dưỡng có khả năng hấp thụ \\text{CO_2} và giải phóng \\text{O_2}, góp phần điều hoà khí hậu, bảo vệ môi trường.';
    const fixedExplanation = normalizeMathFormulas(explanationText);

    expect(fixedExplanation).toContain('$\\mathrm{CO_2}$');
    expect(fixedExplanation).toContain('$\\mathrm{O_2}$');
  });

  it('converts Unicode chemical subscripts like CO₂ and O₂ to KaTeX', () => {
    const raw = 'Khí CO₂ và khí O₂ trao đổi qua khí khổng';
    const fixed = normalizeMathFormulas(raw);
    expect(fixed).toContain('$\\mathrm{CO_2}$');
    expect(fixed).toContain('$\\mathrm{O_2}$');
  });

  it('detects and fixes character issues across a question object', () => {
    const question: Question = {
      id: 1,
      type: 'multiple_choice',
      rawText: '',
      content: 'Cây xanh hấp thụ CO2 để quang hợp',
      options: [
        { key: 'A', content: 'Thải ra O2' },
        { key: 'B', content: 'Hấp thụ H2O' },
        { key: 'C', content: 'Tạo ra đường' },
        { key: 'D', content: 'Sinh vật quang tự dưỡng có khả năng hấp thụ $\\text{CO_2}$' },
      ],
      explanation: 'Giải phóng \\text{O_2} vào khí quyển.',
      correctAnswer: 'D',
      score: 0.25,
    };

    expect(hasFormulaOrCharacterIssue(question.content)).toBe(true);
    expect(hasFormulaOrCharacterIssue(question.options![3].content)).toBe(true);
    expect(hasFormulaOrCharacterIssue(question.explanation!)).toBe(true);

    const { question: fixedQ, fixedCount } = fixQuestionFormulaErrors(question);
    expect(fixedCount).toBeGreaterThanOrEqual(4);

    expect(fixedQ.content).toContain('$\\mathrm{CO_2}$');
    expect(fixedQ.options![0].content).toContain('$\\mathrm{O_2}$');
    expect(fixedQ.options![1].content).toContain('$\\mathrm{H_2O}$');
    expect(fixedQ.options![3].content).toBe('Sinh vật quang tự dưỡng có khả năng hấp thụ $\\mathrm{CO_2}$');
    expect(fixedQ.explanation).toContain('$\\mathrm{O_2}$');
  });

  it('batch fixes entire exam question list with fixExamQuestionsCharacters', () => {
    const questions: Question[] = [
      {
        id: 1,
        type: 'multiple_choice',
        rawText: '',
        content: 'Nồng độ $\\text{CO_2}$',
        options: [{ key: 'A', content: '$\\text{O_2}$' }],
        score: 0.25,
      },
      {
        id: 2,
        type: 'multiple_choice',
        rawText: '',
        content: 'Câu hỏi bình thường không có công thức',
        options: [{ key: 'A', content: 'Đáp án A' }],
        score: 0.25,
      },
    ];

    const result = fixExamQuestionsCharacters(questions);
    expect(result.fixedQuestionsCount).toBe(1);
    expect(result.totalErrorsFixed).toBe(2);
    expect(result.questions[0].content).toBe('Nồng độ $\\mathrm{CO_2}$');
    expect(result.questions[0].options![0].content).toBe('$\\mathrm{O_2}$');
  });
});
