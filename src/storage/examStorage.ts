import { Exam, StudentAnswerValue, Submission } from '../types/exam';

const globalForExamStorage = globalThis as unknown as {
  __memoryExams?: Map<string, Exam>;
  __memoryDrafts?: Map<string, Record<number, StudentAnswerValue>>;
  __memorySubmissions?: Map<string, Submission>;
};

const memoryExams = globalForExamStorage.__memoryExams || new Map<string, Exam>();
globalForExamStorage.__memoryExams = memoryExams;

const memoryDrafts = globalForExamStorage.__memoryDrafts || new Map<string, Record<number, StudentAnswerValue>>();
globalForExamStorage.__memoryDrafts = memoryDrafts;

const memorySubmissions = globalForExamStorage.__memorySubmissions || new Map<string, Submission>();
globalForExamStorage.__memorySubmissions = memorySubmissions;

export const INITIAL_SEEDED_EXAMS: Exam[] = [
  {
    "id": "sample-exam-1",
    "title": "Đề thi minh họa chuẩn GDPT 2018 (3 Dạng câu hỏi)",
    "durationMinutes": 20,
    "totalQuestions": 4,
    "createdAt": "2026-10-24T00:00:00.000Z",
    "isPublic": true,
    "authorId": "system-admin",
    "settings": {
      "shuffleQuestions": false, "shuffleOptions": false, "enableProctoring": false, "maxViolations": 0, "showResultAfterSubmit": "score_and_answers"
    },
    "questions": [
      {
        "id": 1,
        "type": "multiple_choice",
        "rawText": "Câu 1...",
        "content": "Tìm tập nghiệm của phương trình bậc hai $x^2 - 5x + 6 = 0$.",
        "options": [
          {
            "key": "A",
            "content": "$S = \\{1; 6\\}$"
          },
          {
            "key": "B",
            "content": "$S = \\{2; 3\\}$"
          },
          {
            "key": "C",
            "content": "$S = \\{-2; -3\\}$"
          },
          {
            "key": "D",
            "content": "$S = \\{-1; -6\\}$"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Ta có $x^2 - 5x + 6 = (x - 2)(x - 3) = 0 \\Leftrightarrow x = 2$ hoặc $x = 3$.",
        "score": 2.5
      },
      {
        "id": 2,
        "type": "multiple_choice",
        "rawText": "Câu 2...",
        "content": "Tính tích phân sau: $$\\int_0^1 (2x + 1) dx$$",
        "options": [
          {
            "key": "A",
            "content": "$1$"
          },
          {
            "key": "B",
            "content": "$2$"
          },
          {
            "key": "C",
            "content": "$3$"
          },
          {
            "key": "D",
            "content": "$0$"
          }
        ],
        "correctAnswer": "B",
        "explanation": "Ta có $\\int_0^1 (2x + 1) dx = [x^2 + x]_0^1 = (1 + 1) - 0 = 2$.",
        "score": 2.5
      },
      {
        "id": 3,
        "type": "true_false",
        "rawText": "Câu 3...",
        "content": "Cho hàm số $y = f(x) = x^3 - 3x^2 + 2$. Các khẳng định sau đúng hay sai?",
        "options": [],
        "subItems": [
          {
            "key": "a",
            "content": "Đồ thị hàm số đi qua điểm $A(0; 2)$",
            "correctAnswer": true
          },
          {
            "key": "b",
            "content": "Đạo hàm là $f'(x) = 3x^2 - 6x$",
            "correctAnswer": true
          },
          {
            "key": "c",
            "content": "Hàm số đạt cực đại tại $x = 2$",
            "correctAnswer": false
          },
          {
            "key": "d",
            "content": "Giá trị cực tiểu của hàm số bằng $-2$",
            "correctAnswer": true
          }
        ],
        "score": 2.5,
        "explanation": "Hàm số đạt cực đại tại x = 0 (f(0) = 2) và cực tiểu tại x = 2 (f(2) = -2)."
      },
      {
        "id": 4,
        "type": "short_answer",
        "rawText": "Câu 4...",
        "content": "Tìm số điểm cực trị của đồ thị hàm số $g(x) = x^4 - 2x^2 + 3$.",
        "options": [],
        "acceptedAnswers": [
          "3"
        ],
        "score": 2.5,
        "explanation": "Ta có $g'(x) = 4x(x^2 - 1) = 0 \\Leftrightarrow x = 0, x = \\pm 1$ (3 điểm cực trị)."
      }
    ]
  },
  {
    "id": "sample-exam-2",
    "title": "Đề khảo sát Năng lực Toán học THPT Quốc gia 2025 - 2026",
    "durationMinutes": 45,
    "totalQuestions": 4,
    "createdAt": "2026-10-25T00:00:00.000Z",
    "isPublic": true,
    "authorId": "system-admin",
    "settings": {
      "shuffleQuestions": false, "shuffleOptions": false, "enableProctoring": false, "maxViolations": 0, "showResultAfterSubmit": "score_and_answers"
    },
    "questions": [
      {
        "id": 1,
        "type": "multiple_choice",
        "rawText": "Câu 1...",
        "content": "Cho cấp số cộng $(u_n)$ với $u_1 = 3$ và công sai $d = 2$. Tìm số hạng thứ 5 của cấp số cộng.",
        "options": [
          {
            "key": "A",
            "content": "$u_5 = 11$"
          },
          {
            "key": "B",
            "content": "$u_5 = 13$"
          },
          {
            "key": "C",
            "content": "$u_5 = 9$"
          },
          {
            "key": "D",
            "content": "$u_5 = 15$"
          }
        ],
        "correctAnswer": "A",
        "explanation": "Ta có $u_5 = u_1 + 4d = 3 + 4 \\times 2 = 11$.",
        "score": 2.5
      },
      {
        "id": 2,
        "type": "multiple_choice",
        "rawText": "Câu 2...",
        "content": "Trong không gian $Oxyz$, cho mặt cầu $(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 16$. Tọa độ tâm $I$ và bán kính $R$ là:",
        "options": [
          {
            "key": "A",
            "content": "$I(1; -2; 3), R = 4$"
          },
          {
            "key": "B",
            "content": "$I(-1; 2; -3), R = 16$"
          },
          {
            "key": "C",
            "content": "$I(1; -2; 3), R = 16$"
          },
          {
            "key": "D",
            "content": "$I(-1; 2; -3), R = 4$"
          }
        ],
        "correctAnswer": "A",
        "explanation": "Phương trình $(x-a)^2 + (y-b)^2 + (z-c)^2 = R^2 \\Rightarrow I(1; -2; 3), R = \\sqrt{16} = 4$.",
        "score": 2.5
      },
      {
        "id": 3,
        "type": "true_false",
        "rawText": "Câu 3...",
        "content": "Cho hàm số $y = \\frac{2x - 1}{x + 1}$. Xét tính đúng sai của các khẳng định sau:",
        "options": [],
        "subItems": [
          {
            "key": "a",
            "content": "Tập xác định của hàm số là $D = \\mathbb{R} \\setminus \\{-1\\}$",
            "correctAnswer": true
          },
          {
            "key": "b",
            "content": "Tiệm cận đứng của đồ thị là đường thẳng $x = 2$",
            "correctAnswer": false
          },
          {
            "key": "c",
            "content": "Tiệm cận ngang của đồ thị là đường thẳng $y = 2$",
            "correctAnswer": true
          },
          {
            "key": "d",
            "content": "Hàm số đồng biến trên từng khoảng xác định",
            "correctAnswer": true
          }
        ],
        "score": 2.5,
        "explanation": "Tiệm cận đứng là x = -1, tiệm cận ngang là y = 2. Đạo hàm y' = 3/(x+1)^2 > 0 nên hàm số đồng biến."
      },
      {
        "id": 4,
        "type": "short_answer",
        "rawText": "Câu 4...",
        "content": "Một hình nón có bán kính đáy $r = 3\\text{ cm}$ và chiều cao $h = 4\\text{ cm}$. Tính diện tích xung quanh theo $\\pi$ (nhập hệ số trước $\\pi$):",
        "options": [],
        "acceptedAnswers": [
          "15"
        ],
        "score": 2.5,
        "explanation": "Đường sinh $l = \\sqrt{r^2 + h^2} = 5$. Diện tích $S_{xq} = \\pi r l = 15\\pi$."
      }
    ]
  }
];

export function ensureSeededExams(): void {
  if (process.env.NODE_ENV === 'test') return;
  for (const ex of INITIAL_SEEDED_EXAMS) {
    if (!memoryExams.has(ex.id)) {
      memoryExams.set(ex.id, ex);
    }
  }
}

ensureSeededExams();


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

export function updateExam(id: string, updates: Partial<Exam>): Exam | null {
  const existing = getExam(id);
  if (!existing) return null;
  const updated: Exam = { ...existing, ...updates };
  saveExam(updated);
  return updated;
}

export function deleteExam(id: string): boolean {
  let deleted = memoryExams.delete(id);
  if (isBrowser) {
    try {
      const all = listExams();
      const filtered = all.filter(e => e.id !== id);
      if (filtered.length !== all.length) {
        localStorage.setItem(EXAMS_KEY, JSON.stringify(filtered));
        deleted = true;
      }
    } catch (e) {
      console.error('Failed to delete exam from localStorage', e);
    }
  }
  return deleted;
}

export function getExam(id: string): Exam | null {
  ensureSeededExams();
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
  ensureSeededExams();
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

export function deleteSubmission(id: string): boolean {
  let deleted = memorySubmissions.delete(id);
  if (isBrowser) {
    try {
      const raw = localStorage.getItem(SUBMISSIONS_KEY);
      if (raw) {
        const list: Submission[] = JSON.parse(raw);
        const filtered = list.filter(s => s.id !== id);
        if (filtered.length !== list.length) {
          localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(filtered));
          deleted = true;
        }
      }
    } catch (e) {
      console.error('Failed to delete submission from localStorage', e);
    }
  }
  return deleted;
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

export function clearMemoryExams() { memoryExams.clear(); }
export function clearMemorySubmissions() { memorySubmissions.clear(); }
(globalThis as any).__clearExamStores = () => { memoryExams.clear(); memorySubmissions.clear(); };

(globalThis as any).__getExamRecord = (id: string) => {
  const e = getExam(id);
  if (!e) return null;
  return {
    id: e.id,
    title: e.title,
    durationMinutes: e.durationMinutes,
    totalQuestions: e.totalQuestions,
    questionsJson: JSON.stringify(e.questions || []),
    settingsJson: JSON.stringify(e.settings || {}),
    createdAt: new Date(e.createdAt || Date.now()),
  };
};

(globalThis as any).__getSubmissionRecord = (id: string) => {
  const s = getSubmission(id);
  if (!s) return null;
  return {
    id: s.id,
    examId: s.examId,
    studentName: s.studentName,
    studentPhone: s.studentPhone,
    score: s.score,
    totalScore: s.totalScore,
    answersJson: JSON.stringify(s.answers || {}),
    proctoringReportJson: JSON.stringify(s.proctoringReport || {}),
    submittedAt: new Date(s.submittedAt || Date.now()),
  };
};

(globalThis as any).__getExamCount = () => {
  return listExams().length;
};
