# Word (.docx) Exam Import & Share Link System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Implement client-side Word (.docx) exam ingestion with automatic text & embedded base64 image extraction, integration with the GDPT 2018 3-part exam parser, live split-view preview, and post-creation exam link sharing with QR code and one-click copy.

**Architecture:** Client-side binary parsing with mammoth converting docx paragraphs to formatted text and inline images to ![Hình vẽ](data:image/...) markdown tags; enhanced MathView rendering formulas alongside inline images; live dual-mode dropzone in /teacher/create; and responsive Share Modal.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, mammoth, KaTeX, Lucide React, Vitest.

## Global Constraints
- Pure client-side processing for file ingestion (zero server upload dependencies).
- Full compatibility with GDPT 2018 3-part questions (Part I multiple choice, Part II True/False, Part III short answer).
- Retain all existing 24 Vitest test cases without regressions.

---

### Task 1: Install mammoth & Build wordExtractor.ts with TDD

**Files:**
- Create: src/parser/wordExtractor.ts
- Create: 	ests/wordExtractor.test.ts
- Modify: package.json

**Interfaces:**
- Produces:
  `	s
  export interface WordExtractionResult {
    rawText: string;
    imageCount: number;
  }
  export async function extractTextAndImagesFromDocx(buffer: ArrayBuffer): Promise<WordExtractionResult>;
  export function convertDocxHtmlToExamText(html: string): { text: string; imageCount: number };
  `

- [ ] **Step 1: Install mammoth and @types/mammoth**
Run: 
pm install mammoth && npm install -D @types/mammoth

- [ ] **Step 2: Write the failing unit tests for wordExtractor**
Create 	ests/wordExtractor.test.ts:
`	s
import { describe, it, expect } from 'vitest';
import { convertDocxHtmlToExamText } from '../src/parser/wordExtractor';

describe('wordExtractor: convertDocxHtmlToExamText', () => {
  it('converts basic paragraphs and breaks into formatted exam text', () => {
    const html = '<p>Câu 1. Phương trình bậc hai ^2 - 4 = 0$ có nghiệm là:</p><p>A.  = 2$</p><p>B.  = \\pm 2$</p>';
    const result = convertDocxHtmlToExamText(html);
    expect(result.text).toContain('Câu 1. Phương trình bậc hai ^2 - 4 = 0$ có nghiệm là:');
    expect(result.text).toContain('A.  = 2$');
    expect(result.text).toContain('B.  = \\pm 2$');
    expect(result.imageCount).toBe(0);
  });

  it('converts <img> tags into markdown image format and counts images', () => {
    const html = '<p>Câu 2. Cho đồ thị hàm số như hình vẽ sau:</p><p><img src=data:image/png;base64,iVBORw0KGgoAAAANSUhEUg== /></p><p>A. Hàm số đồng biến</p>';
    const result = convertDocxHtmlToExamText(html);
    expect(result.text).toContain('![Hình vẽ](data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==)');
    expect(result.imageCount).toBe(1);
  });

  it('handles tables and cleans non-breaking spaces', () => {
    const html = '<p>Bảng&nbsp;đáp&nbsp;án:</p><table><tr><td>1</td><td>A</td></tr><tr><td>2</td><td>B</td></tr></table>';
    const result = convertDocxHtmlToExamText(html);
    expect(result.text).toContain('Bảng đáp án:');
    expect(result.text).toContain('1 A');
    expect(result.text).toContain('2 B');
  });
});
`

- [ ] **Step 3: Run test to verify it fails**
Run: 
px vitest run tests/wordExtractor.test.ts
Expected: FAIL (module not found)

- [ ] **Step 4: Implement src/parser/wordExtractor.ts**
`	s
import mammoth from 'mammoth';

export interface WordExtractionResult {
  rawText: string;
  imageCount: number;
}

export function convertDocxHtmlToExamText(html: string): { text: string; imageCount: number } {
  let imageCount = 0;

  // Replace images with markdown format: ![Hình vẽ](data:image/...)
  let processed = html.replace(/<img\s+[^>]*src=([^]+)[^>]*>/gi, (_match, src) => {
 imageCount++;
 return \n\n![Hình vẽ]()\n\n;
 });

 // Table handling
 processed = processed.replace(/<\/td>\s*<td[^>]*>/gi, ' ');
 processed = processed.replace(/<\/tr>\s*<tr[^>]*>/gi, '\n');
 processed = processed.replace(/<\/?(table|tbody|thead|tr|td|th)[^>]*>/gi, '\n');

 // Paragraph & break handling
 processed = processed.replace(/<p[^>]*>/gi, '\n');
 processed = processed.replace(/<\/p>/gi, '\n');
 processed = processed.replace(/<br\s*\/?>/gi, '\n');

 // Strip other HTML tags
 processed = processed.replace(/<[^>]+>/g, '');

 // Decode non-breaking spaces and clean whitespace
 processed = processed.replace(/&nbsp;/g, ' ');
 processed = processed.replace(/\u00A0/g, ' ');
 processed = processed.replace(/[ \t]+/g, ' ');
 processed = processed.replace(/\n\s+\n/g, '\n\n');
 processed = processed.replace(/\n{3,}/g, '\n\n');

 return {
 text: processed.trim(),
 imageCount,
 };
}

export async function extractTextAndImagesFromDocx(buffer: ArrayBuffer): Promise<WordExtractionResult> {
 const options = {
 convertImage: mammoth.images.inlineImage(element => {
 return element.read('base64').then(imageBuffer => {
 return {
 src: data:;base64,,
 };
 });
 }),
 };

 const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buffer }, options);
 const { text, imageCount } = convertDocxHtmlToExamText(html);

 return {
 rawText: text,
 imageCount,
 };
}
`

- [ ] **Step 5: Run tests to verify they pass**
Run: 
px vitest run tests/wordExtractor.test.ts
Expected: PASS

- [ ] **Step 6: Commit**
git add package.json package-lock.json src/parser/wordExtractor.ts tests/wordExtractor.test.ts
git commit -m feat(parser): implement Word docx text and base64 image extraction with mammoth

---

### Task 2: Enhance MathView to Render Markdown Images Alongside KaTeX

**Files:**
- Modify: src/components/MathView.tsx
- Modify: ests/parser.test.ts

**Interfaces:**
- Consumes: text containing $ ... $ KaTeX formulas and ![alt](url) markdown images.
- Produces: React elements rendering responsive images and LaTeX expressions seamlessly.

- [ ] **Step 1: Write unit test verifying parser preservation of image markdown**
Add test in ests/parser.test.ts:
` s
it('preserves embedded markdown images within question content', () => {
 const raw = 
Câu 1. Cho đồ thị như hình vẽ sau:
![Hình vẽ](data:image/png;base64,sample123)
Hàm số đã cho đồng biến trên khoảng nào?
A. (0; 2)
B. (-1; 1)
C. (1; 3)
D. (-infinity; 0)
Đáp án: A
 .trim();
 const exam = parseExamText(raw, 'Đề thi có hình ảnh');
 expect(exam.questions[0].content).toContain('![Hình vẽ](data:image/png;base64,sample123)');
});
`

- [ ] **Step 2: Run test to verify it passes**
Run: 
px vitest run tests/parser.test.ts
Expected: PASS (already preserves text)

- [ ] **Step 3: Update src/components/MathView.tsx to render markdown images**
In src/components/MathView.tsx:
Split text segments by (!\[.*?\]\(.*?\)) so that:
- Image tokens ![alt](src) are rendered as <img src={src} alt={alt} className=my-3 max-h-80 max-w-full rounded-xl border border-gray-200 shadow-sm object-contain bg-white />.
- Non-image text segments continue to be parsed by KaTeX regex.

- [ ] **Step 4: Run all unit tests**
Run: 
px vitest run
Expected: 25/25 tests PASS

- [ ] **Step 5: Commit**
git add src/components/MathView.tsx tests/parser.test.ts
git commit -m feat(ui): support rendering embedded markdown images in MathView

---

### Task 3: Build Word File Drag & Drop Ingestion in /teacher/create

**Files:**
- Modify: src/app/teacher/create/page.tsx

**Interfaces:**
- Allows switching between [ 📁 Tải file Word (.docx) ] and [ 📝 Dán văn bản trực tiếp ].
- Provides drag & drop file dropzone with instant extraction feedback.
- Populates raw text into left split editor, triggering live parsing on right pane.

- [ ] **Step 1: Add Dropzone and File Handler in src/app/teacher/create/page.tsx**
Add:
- Tab selector state: const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
- File upload state: isExtracting, extractedFileInfo: { name: string; size: string; images: number } | null
- Drag events (onDragOver, onDragLeave, onDrop) and native file input <input type=file accept=.docx />.
- On file selected: read ile.arrayBuffer(), call extractTextAndImagesFromDocx(buffer), set awText to extracted text.
- Show badge notification: Đã trích xuất X câu hỏi và Y hình ảnh từ file Word!.

- [ ] **Step 2: Typecheck & build validation**
Run: 
px tsc --noEmit
Expected: 0 errors

- [ ] **Step 3: Commit**
git add src/app/teacher/create/page.tsx
git commit -m feat(teacher): add Word docx drag-and-drop ingestion tab in exam creator

---

### Task 4: Build Exam Share Modal with QR Code and One-Click Copy

**Files:**
- Create: src/components/ShareExamModal.tsx
- Modify: src/app/teacher/create/page.tsx
- Modify: src/app/teacher/exams/page.tsx

**Interfaces:**
` s
export interface ShareExamModalProps {
 isOpen: boolean;
 onClose: () => void;
 examId: string;
 examTitle: string;
 durationMinutes: number;
 totalQuestions: number;
}
`

- [ ] **Step 1: Create src/components/ShareExamModal.tsx**
Features:
- Backdrop modal with smooth animation.
- Title and exam info badges (Thời gian, Số câu).
- Direct Exam URL input with Copy button (triggers feedback Đã copy link!).
- QR code image: <img src={https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=} /> with download or scan prompt for mobile students.
- Action buttons: Vào phòng thi thử (target=_blank), Quản lý đề thi (navigates to /teacher/exams).

- [ ] **Step 2: Connect Share Modal to eacher/create and eacher/exams**
- After saving an exam in eacher/create, open ShareExamModal instead of immediate redirect.
- In eacher/exams, add Chia sẻ link button on each exam card that opens ShareExamModal.

- [ ] **Step 3: Typecheck & unit tests**
Run: 
px tsc --noEmit && npx vitest run
Expected: PASS

- [ ] **Step 4: Commit**
git add src/components/ShareExamModal.tsx src/app/teacher/create/page.tsx src/app/teacher/exams/page.tsx
git commit -m feat(share): implement ShareExamModal with QR code and quick-copy

---

### Task 5: End-to-End Verification & Real Sample Word Document Test

**Files:**
- Create: scripts/generate-sample-docx.js (creates a real test .docx file with formulas and 3 question types)
- Test end-to-end ingestion and link sharing workflow

- [ ] **Step 1: Generate a test .docx file**
Create scripts/generate-sample-docx.js or construct a valid .docx test artifact.
- [ ] **Step 2: Run complete test suite and production build**
Run: 
px vitest run
Run: 
pm run build
Expected: 0 errors
- [ ] **Step 3: Verify dev server on port 3000**
Access http://localhost:3000/teacher/create and test the dropzone and modal.
- [ ] **Step 4: Commit final verification**
git commit -m test(e2e): verify full Word docx import and exam share link flow
