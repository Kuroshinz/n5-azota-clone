/**
 * Global Omnibar Search Helper for N5Exam Admin Dashboard
 */

export interface OmnibarUser {
  id: string;
  fullName: string;
  phone?: string;
  email?: string | null;
  role: string;
}

export interface OmnibarExam {
  id: string;
  title: string;
  author?: { fullName?: string } | null;
}

export interface OmnibarSubmission {
  id: string;
  studentName: string;
  score: number;
  totalScore: number;
  exam?: { title?: string } | null;
}

export interface OmnibarSearchResults {
  users: OmnibarUser[];
  exams: OmnibarExam[];
  submissions: OmnibarSubmission[];
  total: number;
}

export function searchOmnibar(
  query: string,
  users: OmnibarUser[] = [],
  exams: OmnibarExam[] = [],
  submissions: OmnibarSubmission[] = []
): OmnibarSearchResults {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { users: [], exams: [], submissions: [], total: 0 };
  }

  const matchedUsers = users.filter(u =>
    (u.fullName && u.fullName.toLowerCase().includes(q)) ||
    (u.phone && u.phone.includes(q)) ||
    (u.email && u.email.toLowerCase().includes(q)) ||
    (u.role && u.role.toLowerCase().includes(q))
  ).slice(0, 5);

  const matchedExams = exams.filter(e =>
    (e.title && e.title.toLowerCase().includes(q)) ||
    (e.id && e.id.toLowerCase().includes(q)) ||
    (e.author?.fullName && e.author.fullName.toLowerCase().includes(q))
  ).slice(0, 5);

  const matchedSubmissions = submissions.filter(s =>
    (s.studentName && s.studentName.toLowerCase().includes(q)) ||
    (s.id && s.id.toLowerCase().includes(q)) ||
    (s.exam?.title && s.exam.title.toLowerCase().includes(q))
  ).slice(0, 5);

  return {
    users: matchedUsers,
    exams: matchedExams,
    submissions: matchedSubmissions,
    total: matchedUsers.length + matchedExams.length + matchedSubmissions.length,
  };
}
