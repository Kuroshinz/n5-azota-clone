import { Question, QuestionType } from '../types/exam';

export interface GdptMatrixCounts {
  part1Count: number; // multiple_choice
  part2Count: number; // true_false
  part3Count: number; // short_answer
  totalCount: number;
}

export interface GdptMatrixConfig {
  part1ScorePerQuestion: number; // Điểm mỗi câu Phần I (mặc định 0.25)
  part2ScorePerQuestion: number; // Điểm mỗi câu Phần II (mặc định 1.00)
  part3ScorePerQuestion: number; // Điểm mỗi câu Phần III (mặc định 0.25 hoặc 0.50)
  targetTotalScore: number;      // Mặc định 10.00
}

export const GDPT_PRESETS = [
  {
    id: 'khtn',
    name: 'Chuẩn KHTN / Lý - Hóa - Sinh (18 - 4 - 6)',
    description: '18 câu TN (0.25đ = 4.5đ) + 4 câu Đ/S (1.0đ = 4.0đ) + 6 câu TLN (0.25đ = 1.5đ)',
    part1Score: 0.25,
    part2Score: 1.00,
    part3Score: 0.25,
    targetTotalScore: 10.0,
  },
  {
    id: 'math',
    name: 'Chuẩn Toán học GDPT 2018 (12 - 4 - 6)',
    description: '12 câu TN (0.25đ = 3.0đ) + 4 câu Đ/S (1.0đ = 4.0đ) + 6 câu TLN (0.50đ = 3.0đ)',
    part1Score: 0.25,
    part2Score: 1.00,
    part3Score: 0.50,
    targetTotalScore: 10.0,
  },
  {
    id: 'social',
    name: 'Chuẩn Lịch sử - Địa lý (24 - 4 - 0)',
    description: '24 câu TN (0.25đ = 6.0đ) + 4 câu Đ/S (1.0đ = 4.0đ)',
    part1Score: 0.25,
    part2Score: 1.00,
    part3Score: 0.25,
    targetTotalScore: 10.0,
  },
];

export function countQuestionTypes(questions: Question[]): GdptMatrixCounts {
  let part1 = 0;
  let part2 = 0;
  let part3 = 0;

  for (const q of questions) {
    const t = q.type || 'multiple_choice';
    if (t === 'true_false') part2++;
    else if (t === 'short_answer') part3++;
    else part1++;
  }

  return {
    part1Count: part1,
    part2Count: part2,
    part3Count: part3,
    totalCount: questions.length,
  };
}

export function calculateMatrixTotal(counts: GdptMatrixCounts, config: GdptMatrixConfig): number {
  const sum =
    counts.part1Count * config.part1ScorePerQuestion +
    counts.part2Count * config.part2ScorePerQuestion +
    counts.part3Count * config.part3ScorePerQuestion;
  return Number(sum.toFixed(2));
}

/**
 * Auto-suggests appropriate scores per question for the 3 parts based on question counts
 * so that total score hits targetTotalScore (10.00) perfectly.
 */
export function autoSuggestMatrixConfig(
  counts: GdptMatrixCounts,
  targetTotalScore: number = 10
): GdptMatrixConfig {
  const { part1Count, part2Count, part3Count, totalCount } = counts;
  if (totalCount === 0) {
    return {
      part1ScorePerQuestion: 0.25,
      part2ScorePerQuestion: 1.00,
      part3ScorePerQuestion: 0.25,
      targetTotalScore,
    };
  }

  // Exact standard match check
  if (part1Count === 18 && part2Count === 4 && part3Count === 6) {
    return {
      part1ScorePerQuestion: 0.25,
      part2ScorePerQuestion: 1.00,
      part3ScorePerQuestion: 0.25,
      targetTotalScore: 10,
    };
  }
  if (part1Count === 12 && part2Count === 4 && part3Count === 6) {
    return {
      part1ScorePerQuestion: 0.25,
      part2ScorePerQuestion: 1.00,
      part3ScorePerQuestion: 0.50,
      targetTotalScore: 10,
    };
  }

  // General distribution:
  // If Part II (True/False) exists, assign 1.0 point each if remaining space permits
  let p2Score = part2Count > 0 ? 1.0 : 0;
  let remainingScore = targetTotalScore - part2Count * p2Score;

  if (remainingScore <= 0 && part2Count > 0) {
    p2Score = Number((targetTotalScore / totalCount).toFixed(2));
    remainingScore = targetTotalScore - part2Count * p2Score;
  }

  const p1And3Count = part1Count + part3Count;
  let p1Score = 0.25;
  let p3Score = 0.25;

  if (p1And3Count > 0) {
    const rawScore = remainingScore / p1And3Count;
    p1Score = Number(rawScore.toFixed(2));
    p3Score = Number(rawScore.toFixed(2));
  }

  return {
    part1ScorePerQuestion: p1Score > 0 ? p1Score : 0.25,
    part2ScorePerQuestion: p2Score > 0 ? p2Score : 1.00,
    part3ScorePerQuestion: p3Score > 0 ? p3Score : 0.25,
    targetTotalScore,
  };
}

/**
 * Applies GDPT matrix configuration to question list with precise round-off balancing
 * so that sum(q.score) exactly equals targetTotalScore.
 */
export function applyGdptMatrix(
  questions: Question[],
  config: GdptMatrixConfig
): Question[] {
  if (questions.length === 0) return [];

  // 1. Initial assignment based on type
  const updated = questions.map(q => {
    const t = q.type || 'multiple_choice';
    let s = config.part1ScorePerQuestion;
    if (t === 'true_false') s = config.part2ScorePerQuestion;
    else if (t === 'short_answer') s = config.part3ScorePerQuestion;
    return {
      ...q,
      score: Number(s.toFixed(2)),
    };
  });

  // 2. Exact balance check against targetTotalScore
  const targetCents = Math.round(config.targetTotalScore * 100);
  const currentCents = Math.round(updated.reduce((sum, q) => sum + q.score * 100, 0));
  const diffCents = targetCents - currentCents;

  if (diffCents !== 0) {
    // Distribute diff cents (+/- 1 cent) across questions
    const step = diffCents > 0 ? 1 : -1;
    const absDiff = Math.min(Math.abs(diffCents), updated.length);

    for (let i = 0; i < absDiff; i++) {
      const newScore = Math.max(0.01, (updated[i].score * 100 + step) / 100);
      updated[i] = {
        ...updated[i],
        score: Number(newScore.toFixed(2)),
      };
    }
  }

  return updated;
}
