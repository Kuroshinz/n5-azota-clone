import { ExamSettings, DEFAULT_EXAM_SETTINGS, Question, Option } from '../types/exam';

/**
 * Validates whether a student can access/enter the exam based on its settings.
 */
export function validateExamAccess(
  settings?: ExamSettings,
  passwordInput?: string,
  currentTime?: Date
): { allowed: boolean; reason?: 'not_started' | 'ended' | 'invalid_password' } {
  const currentSettings = settings || DEFAULT_EXAM_SETTINGS;
  const now = currentTime || new Date();

  // 1. Check password
  if (currentSettings.password && currentSettings.password.trim() !== '') {
    if (!passwordInput || passwordInput.trim() !== currentSettings.password.trim()) {
      return { allowed: false, reason: 'invalid_password' };
    }
  }

  // 2. Check start time
  if (currentSettings.startTime) {
    const startDate = new Date(currentSettings.startTime);
    if (!isNaN(startDate.getTime()) && now.getTime() < startDate.getTime()) {
      return { allowed: false, reason: 'not_started' };
    }
  }

  // 3. Check end time
  if (currentSettings.endTime) {
    const endDate = new Date(currentSettings.endTime);
    if (!isNaN(endDate.getTime()) && now.getTime() > endDate.getTime()) {
      return { allowed: false, reason: 'ended' };
    }
  }

  return { allowed: true };
}

/**
 * Randomizes question array order using Fisher-Yates shuffle.
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Shuffles questions and/or multiple-choice options according to exam settings.
 * Preserves original question IDs and option keys so that grading is 100% accurate.
 */
export function shuffleExamQuestions(
  questions: Question[],
  shuffleQuestions: boolean,
  shuffleOptions: boolean
): Question[] {
  if (!questions || questions.length === 0) return [];
  if (!shuffleQuestions && !shuffleOptions) return questions;

  let result = questions.map((q) => {
    // If option shuffling is enabled and it is a multiple-choice question
    if (shuffleOptions && (q.type === 'multiple_choice' || !q.type) && q.options && q.options.length > 1) {
      return {
        ...q,
        options: shuffleArray<Option>(q.options),
      };
    }
    return { ...q };
  });

  if (shuffleQuestions) {
    result = shuffleArray(result);
  }

  return result;
}
