import { describe, it, expect } from 'vitest';
import { searchOmnibar, OmnibarUser, OmnibarExam, OmnibarSubmission } from '../src/utils/adminSearch';

describe('Global Omnibar Search Utility', () => {
  const mockUsers: OmnibarUser[] = [
    { id: 'u1', fullName: 'Nguyễn Văn An', phone: '0912345678', email: 'an@gmail.com', role: 'TEACHER' },
    { id: 'u2', fullName: 'Trần Thị Bình', phone: '0987654321', email: 'binh@gmail.com', role: 'USER' },
    { id: 'u3', fullName: 'Lê Hoàng Cường', phone: '0933333333', email: 'cuong@gmail.com', role: 'ADMIN' },
  ];

  const mockExams: OmnibarExam[] = [
    { id: 'exam-101', title: 'Đề thi Khảo sát Toán 12 Chuẩn GDPT', author: { fullName: 'Nguyễn Văn An' } },
    { id: 'exam-102', title: 'Đề thi Thử Tiếng Nhật N5 Choukai', author: { fullName: 'Trần Thị Bình' } },
  ];

  const mockSubmissions: OmnibarSubmission[] = [
    { id: 'sub-1', studentName: 'Phạm Minh Đức', score: 9.5, totalScore: 10, exam: { title: 'Đề thi Khảo sát Toán 12' } },
    { id: 'sub-2', studentName: 'Vũ Thị Hoa', score: 8.0, totalScore: 10, exam: { title: 'Đề thi Thử Tiếng Nhật N5' } },
  ];

  it('returns empty results for empty or whitespace query', () => {
    const res = searchOmnibar('   ', mockUsers, mockExams, mockSubmissions);
    expect(res.total).toBe(0);
    expect(res.users.length).toBe(0);
    expect(res.exams.length).toBe(0);
    expect(res.submissions.length).toBe(0);
  });

  it('finds users by name, phone, email, or role', () => {
    const resName = searchOmnibar('Văn An', mockUsers, mockExams, mockSubmissions);
    expect(resName.users.length).toBe(1);
    expect(resName.users[0].fullName).toBe('Nguyễn Văn An');

    const resPhone = searchOmnibar('0987654321', mockUsers, mockExams, mockSubmissions);
    expect(resPhone.users.length).toBe(1);
    expect(resPhone.users[0].fullName).toBe('Trần Thị Bình');

    const resRole = searchOmnibar('ADMIN', mockUsers, mockExams, mockSubmissions);
    expect(resRole.users.length).toBe(1);
    expect(resRole.users[0].fullName).toBe('Lê Hoàng Cường');
  });

  it('finds exams by title and id', () => {
    const res = searchOmnibar('Tiếng Nhật', mockUsers, mockExams, mockSubmissions);
    expect(res.exams.length).toBe(1);
    expect(res.exams[0].title).toContain('Tiếng Nhật N5');

    const resId = searchOmnibar('exam-101', mockUsers, mockExams, mockSubmissions);
    expect(resId.exams.length).toBe(1);
    expect(resId.exams[0].id).toBe('exam-101');
  });

  it('finds submissions by studentName and matching exam title', () => {
    const res = searchOmnibar('Phạm Minh', mockUsers, mockExams, mockSubmissions);
    expect(res.submissions.length).toBe(1);
    expect(res.submissions[0].studentName).toBe('Phạm Minh Đức');
  });

  it('aggregates total results correctly across categories', () => {
    // Both user "Nguyễn Văn An" and exam authored by him contain "An"
    const res = searchOmnibar('An', mockUsers, mockExams, mockSubmissions);
    expect(res.total).toBeGreaterThanOrEqual(2);
  });
});
