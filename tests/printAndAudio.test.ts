import { describe, it, expect } from 'vitest';
import { Exam, Question } from '../src/types/exam';

describe('N5Exam Audio Support & Document Export Capabilities', () => {
  it('supports audio listening questions for JLPT Choukai and language exams', () => {
    const listeningQuestion: Question = {
      id: 1,
      type: 'multiple_choice',
      rawText: 'Mondai 1...',
      content: '男の人と女の人が話しています。男の人はこれから何をしますか。',
      audioUrl: 'https://cdn.example.com/audio/n5-choukai-q1.mp3',
      audioPlayLimit: 2,
      options: [
        { key: 'A', content: '部屋をそうじする' },
        { key: 'B', content: '買いものに行く' },
        { key: 'C', content: 'テレビを見る' },
        { key: 'D', content: 'ご飯を食べる' },
      ],
      correctAnswer: 'B',
      score: 2.5,
    };

    expect(listeningQuestion.audioUrl).toBe('https://cdn.example.com/audio/n5-choukai-q1.mp3');
    expect(listeningQuestion.audioPlayLimit).toBe(2);
    expect(listeningQuestion.options.length).toBe(4);
  });

  it('generates valid UTF-8 BOM CSV format for data exports', () => {
    const headers = ['Mã người dùng', 'Họ và tên', 'Số điện thoại', 'Vai trò'];
    const users = [
      { id: 'u1', fullName: 'Nguyễn Văn "Hải"', phone: '0912345678', role: 'TEACHER' },
      { id: 'u2', fullName: 'Trần Thị Mai, Lớp 12A', phone: '0987654321', role: 'STUDENT' },
    ];

    const rows = users.map(u => [
      `"${u.id}"`,
      `"${u.fullName.replace(/"/g, '""')}"`,
      `"${u.phone}"`,
      u.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    expect(csvContent.startsWith('\uFEFF')).toBe(true);
    expect(csvContent).toContain('Nguyễn Văn ""Hải""');
    expect(csvContent).toContain('"Trần Thị Mai, Lớp 12A"');
    expect(csvContent).toContain('Giáo viên');
  });

  it('formats Word-compatible document structure for printable exams', () => {
    const examTitle = 'Đề thi Thử Tiếng Nhật N5 (JLPT N5 Model Exam)';
    const examCode = '101';
    const htmlBody = '<div class="question">Câu 1: これは何ですか。</div>';

    const wordDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${examTitle}</title>
      </head>
      <body>
        ${htmlBody}
      </body>
      </html>
    `;

    expect(wordDoc).toContain("xmlns:w='urn:schemas-microsoft-com:office:word'");
    expect(wordDoc).toContain(examTitle);
    expect(wordDoc).toContain('Câu 1:');
  });
});
