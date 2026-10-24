import { describe, it, expect } from 'vitest';
import {
  countQuestionTypes,
  calculateMatrixTotal,
  autoSuggestMatrixConfig,
  applyGdptMatrix,
  GDPT_PRESETS,
} from '../src/utils/gdptMatrix';
import { Question } from '../src/types/exam';

function makeMockQuestions(
  part1Count: number,
  part2Count: number,
  part3Count: number
): Question[] {
  const questions: Question[] = [];
  let id = 1;

  for (let i = 0; i < part1Count; i++) {
    questions.push({
      id: id++,
      type: 'multiple_choice',
      rawText: `Câu ${id}`,
      content: `Nội dung ${id}`,
      options: [
        { key: 'A', content: '1' },
        { key: 'B', content: '2' },
      ],
      correctAnswer: 'A',
      score: 0.25,
    });
  }

  for (let i = 0; i < part2Count; i++) {
    questions.push({
      id: id++,
      type: 'true_false',
      rawText: `Câu ${id}`,
      content: `Nội dung ${id}`,
      options: [],
      subItems: [
        { key: 'a', content: 'Ý a', correctAnswer: true },
        { key: 'b', content: 'Ý b', correctAnswer: false },
        { key: 'c', content: 'Ý c', correctAnswer: true },
        { key: 'd', content: 'Ý d', correctAnswer: false },
      ],
      score: 1.0,
    });
  }

  for (let i = 0; i < part3Count; i++) {
    questions.push({
      id: id++,
      type: 'short_answer',
      rawText: `Câu ${id}`,
      content: `Nội dung ${id}`,
      options: [],
      acceptedAnswers: ['10'],
      score: 0.25,
    });
  }

  return questions;
}

describe('GDPT 2018 Scoring Matrix Engine', () => {
  it('correctly counts question types in exam', () => {
    const questions = makeMockQuestions(18, 4, 6);
    const counts = countQuestionTypes(questions);

    expect(counts.part1Count).toBe(18);
    expect(counts.part2Count).toBe(4);
    expect(counts.part3Count).toBe(6);
    expect(counts.totalCount).toBe(28);
  });

  it('applies standard KHTN preset (18 - 4 - 6) to hit exactly 10.00 points', () => {
    const questions = makeMockQuestions(18, 4, 6);
    const preset = GDPT_PRESETS.find(p => p.id === 'khtn')!;

    const updated = applyGdptMatrix(questions, {
      part1ScorePerQuestion: preset.part1Score,
      part2ScorePerQuestion: preset.part2Score,
      part3ScorePerQuestion: preset.part3Score,
      targetTotalScore: preset.targetTotalScore,
    });

    // Check Part I scores: 18 * 0.25 = 4.5
    expect(updated[0].score).toBe(0.25);
    expect(updated[17].score).toBe(0.25);

    // Check Part II scores: 4 * 1.00 = 4.0
    expect(updated[18].score).toBe(1.00);
    expect(updated[21].score).toBe(1.00);

    // Check Part III scores: 6 * 0.25 = 1.5
    expect(updated[22].score).toBe(0.25);
    expect(updated[27].score).toBe(0.25);

    // Total must be exactly 10.00
    const total = updated.reduce((sum, q) => sum + q.score, 0);
    expect(Number(total.toFixed(2))).toBe(10.00);
  });

  it('applies standard Math preset (12 - 4 - 6) to hit exactly 10.00 points', () => {
    const questions = makeMockQuestions(12, 4, 6);
    const preset = GDPT_PRESETS.find(p => p.id === 'math')!;

    const updated = applyGdptMatrix(questions, {
      part1ScorePerQuestion: preset.part1Score,
      part2ScorePerQuestion: preset.part2Score,
      part3ScorePerQuestion: preset.part3Score,
      targetTotalScore: preset.targetTotalScore,
    });

    // 12 * 0.25 (3.0) + 4 * 1.0 (4.0) + 6 * 0.5 (3.0) = 10.0
    const total = updated.reduce((sum, q) => sum + q.score, 0);
    expect(Number(total.toFixed(2))).toBe(10.00);
  });

  it('auto-suggests and balances non-standard exam with 68 multiple choice questions to 10.00', () => {
    const questions = makeMockQuestions(68, 0, 0);
    const counts = countQuestionTypes(questions);
    const suggested = autoSuggestMatrixConfig(counts, 10);

    const updated = applyGdptMatrix(questions, suggested);
    expect(updated).toHaveLength(68);

    const total = updated.reduce((sum, q) => sum + q.score, 0);
    expect(Number(total.toFixed(2))).toBe(10.00);
  });

  it('balances mixed non-standard exam (20 MCQ, 2 TF, 3 Short Answer) to exactly 10.00', () => {
    const questions = makeMockQuestions(20, 2, 3);
    const counts = countQuestionTypes(questions);
    const suggested = autoSuggestMatrixConfig(counts, 10);

    const updated = applyGdptMatrix(questions, suggested);
    const total = updated.reduce((sum, q) => sum + q.score, 0);
    expect(Number(total.toFixed(2))).toBe(10.00);
  });
});
