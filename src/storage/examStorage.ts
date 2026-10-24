import { Exam, StudentAnswerValue, Submission } from '../types/exam';

const memoryExams = new Map<string, Exam>();
const memoryDrafts = new Map<string, Record<number, StudentAnswerValue>>();
const memorySubmissions = new Map<string, Submission>();

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const EXAMS_KEY = 'azota_exams';
const DRAFT_PREFIX = 'azota_draft_';
const SUBMISSIONS_KEY = 'azota_submissions';

export function saveExam(exam: Exam): void {
  memoryExams.set(exam.id, exam);
  if (isBrowser) {
    try {
      const all = listExams();
      const filtered = all.filter(e => e.id !== exam.id);
      filtered.unshift(exam);
      localStorage.setItem(EXAMS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to save exam to localStorage', e);
    }
  }
}

export function getExam(id: string): Exam | null {
  if (memoryExams.has(id)) {
    return memoryExams.get(id) || null;
  }
  if (isBrowser) {
    try {
      const raw = localStorage.getItem(EXAMS_KEY);
      if (raw) {
        const list: Exam[] = JSON.parse(raw);
        const found = list.find(e => e.id === id);
        if (found) {
          memoryExams.set(id, found);
          return found;
        }
      }
    } catch (e) {
      console.error('Failed to get exam from localStorage', e);
    }
  }
  return null;
}

export function listExams(): Exam[] {
  if (isBrowser) {
    try {
      const raw = localStorage.getItem(EXAMS_KEY);
      if (raw) {
        const list: Exam[] = JSON.parse(raw);
        list.forEach(e => memoryExams.set(e.id, e));
        return list;
      }
    } catch (e) {
      console.error('Failed to list exams from localStorage', e);
    }
  }
  return Array.from(memoryExams.values());
}

export function saveDraft(examId: string, answers: Record<number, StudentAnswerValue>): void {
  memoryDrafts.set(examId, { ...answers });
  if (isBrowser) {
    try {
      localStorage.setItem(`${DRAFT_PREFIX}${examId}`, JSON.stringify(answers));
    } catch (e) {
      console.error('Failed to save draft to localStorage', e);
    }
  }
}

export function getDraft(examId: string): Record<number, StudentAnswerValue> {
  if (isBrowser) {
    try {
      const raw = localStorage.getItem(`${DRAFT_PREFIX}${examId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryDrafts.set(examId, parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to get draft from localStorage', e);
    }
  }
  return memoryDrafts.get(examId) || {};
}

export function clearDraft(examId: string): void {
  memoryDrafts.delete(examId);
  if (isBrowser) {
    try {
      localStorage.removeItem(`${DRAFT_PREFIX}${examId}`);
    } catch (e) {
      console.error('Failed to clear draft from localStorage', e);
    }
  }
}

export function calculateScore(
  exam: Exam,
  answers: Record<number, StudentAnswerValue>
): { score: number; totalScore: number; correctCount: number } {
  let score = 0;
  let totalScore = 0;
  let correctCount = 0;

  for (const q of exam.questions) {
    totalScore += q.score;
    const studentAns = answers[q.id];
    if (studentAns === undefined || studentAns === null) continue;

    const qType = q.type || 'multiple_choice';

    if (qType === 'multiple_choice') {
      if (typeof studentAns === 'string' && q.correctAnswer) {
        if (studentAns.trim().toUpperCase() === q.correctAnswer.toUpperCase()) {
          score += q.score;
          correctCount += 1;
        }
      }
    } else if (qType === 'true_false' && q.subItems && q.subItems.length > 0) {
      if (typeof studentAns === 'object' && studentAns !== null) {
        const studentTf = studentAns as Record<string, boolean>;
        let matchingSubItems = 0;
        for (const sub of q.subItems) {
          if (sub.correctAnswer !== undefined && studentTf[sub.key] === sub.correctAnswer) {
            matchingSubItems += 1;
          }
        }

        let ratio = 0;
        if (matchingSubItems === 1) ratio = 0.1;
        else if (matchingSubItems === 2) ratio = 0.25;
        else if (matchingSubItems === 3) ratio = 0.5;
        else if (matchingSubItems === 4) {
          ratio = 1.0;
          correctCount += 1;
        }

        score += Number((ratio * q.score).toFixed(2));
      }
    } else if (qType === 'short_answer' && q.acceptedAnswers && q.acceptedAnswers.length > 0) {
      if (typeof studentAns === 'string') {
        const norm = (s: string) => s.trim().replace(/,/g, '.').toLowerCase();
        const studentNorm = norm(studentAns);
        const isMatch = q.acceptedAnswers.some(accepted => norm(accepted) === studentNorm);
        if (isMatch) {
          score += q.score;
          correctCount += 1;
        }
      }
    }
  }

  return {
    score: Number(score.toFixed(2)),
    totalScore: Number(totalScore.toFixed(2)),
    correctCount,
  };
}

export function saveSubmission(submission: Submission): void {
  memorySubmissions.set(submission.id, submission);
  if (isBrowser) {
    try {
      const raw = localStorage.getItem(SUBMISSIONS_KEY);
      const list: Submission[] = raw ? JSON.parse(raw) : [];
      const filtered = list.filter(s => s.id !== submission.id);
      filtered.unshift(submission);
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to save submission to localStorage', e);
    }
  }
}

export function getSubmissions(examId?: string): Submission[] {
  let list: Submission[] = [];
  if (isBrowser) {
    try {
      const raw = localStorage.getItem(SUBMISSIONS_KEY);
      if (raw) {
        list = JSON.parse(raw);
        list.forEach(s => memorySubmissions.set(s.id, s));
      }
    } catch (e) {
      console.error('Failed to get submissions from localStorage', e);
    }
  } else {
    list = Array.from(memorySubmissions.values());
  }

  if (examId) {
    return list.filter(s => s.examId === examId);
  }
  return list;
}

export function getSubmission(id: string): Submission | null {
  if (memorySubmissions.has(id)) {
    return memorySubmissions.get(id) || null;
  }
  const all = getSubmissions();
  return all.find(s => s.id === id) || null;
}

export const getStoredExams = listExams;

