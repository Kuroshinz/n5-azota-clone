# Design Specification: Word (.docx) Exam Import & Share Link System

## 1. Overview
This specification details the client-side Word (.docx) exam ingestion engine and exam link sharing system for Azota Clone Pro. It enables teachers to drag-and-drop .docx files containing Vietnamese math/science exams, automatically extracts text and embedded figures/diagrams as base64 images, feeds them into the GDPT 2018 3-part regex parser, allows instant split-view editing/reviewing, and provides exam link sharing with QR code and one-click copy.

---

## 2. Architecture & Components

`mermaid
flowchart TD
    A[Teacher drops .docx file] --> B[Browser File API / ArrayBuffer]
    B --> C[src/parser/wordExtractor.ts\nmammoth with image handler]
    C -->|Text + Base64 ![image](data:...)| D[src/parser/examParser.ts]
    D -->|Exam object with 3 question types| E[Live Split-View Editor]
    E -->|Publish Exam| F[localStorage & /api/exams]
    F --> G[Share Modal with Link, Copy & QR Code]
`

### 2.1 Dependency: mammoth
- Package: mammoth (lightweight, zero-native-dependency Word (.docx) HTML/text converter running in both browser and Node.js).
- mammoth.convertToHtml({ arrayBuffer }) with convertImage: mammoth.images.inlineImage(...) to convert drawing objects, charts, and inline pictures to data:image/...;base64,....
- Post-process HTML into standardized exam text while preserving ![hình vẽ](data:...) tags and math formulas $ ... $.

### 2.2 Word Extractor: src/parser/wordExtractor.ts
- Function: extractExamFromDocx(file: File | ArrayBuffer): Promise<{ rawText: string; imageCount: number }>
- Features:
  - Reads binary ArrayBuffer from browser File object.
  - Converts paragraphs and tables into formatted text with newlines.
  - Replaces <img> tags with standard markdown image tokens ![Hình vẽ](data:image/...).
  - Cleans up non-breaking spaces \u00A0 and redundant whitespace.

### 2.3 Image-Aware KaTeX Component: src/components/MathView.tsx
- Ensure MathView detects ![alt](url) markdown images and renders them as responsive <img className=max-h-72 rounded-lg border my-2 /> elements alongside KaTeX math formulas.

### 2.4 Teacher Create UI Upgrade: src/app/teacher/create/page.tsx
- **Dual Ingestion Tabs**:
  - [ 📁 Tải file Word (.docx) ] vs [ 📝 Dán văn bản trực tiếp ].
- **Drag-and-Drop Zone**:
  - Accepts .docx files.
  - Displays file name, size, extraction status, and number of extracted images.
- **Live Split-View**:
  - Left pane: editable extracted text (allowing immediate corrections).
  - Right pane: live parsed cards (showing rendered math & diagrams).
- **Post-Publish Share Modal**:
  - Displays newly generated exam URL (http://localhost:3000/exam/[id]).
  - One-click copy link with toast notification.
  - Instant QR code image rendered via SVG / public QR service (https://api.qrserver.com/v1/create-qr-code/).
  - Action buttons: *Vào thi thử* & *Quay lại danh sách đề*.

---

## 3. Data Flow & Formats

1. **Input**: Microsoft Word .docx file uploaded by teacher.
2. **Intermediate**: Plain text with $ ... $ math and ![Hình vẽ](data:image/png;base64,...) images.
3. **Parser Output**: Exam structure with Question[] (Part I Multiple Choice, Part II True/False GDPT 2018, Part III Short Answer).
4. **Storage**: Persisted to localStorage and synchronized via REST API.

---

## 4. Testing & Verification Plan

1. **Unit Tests**:
   - 	ests/wordExtractor.test.ts: test HTML-to-markdown image conversion, paragraph handling, and error handling for invalid files.
   - 	ests/mathView.test.ts or parser integration: verify image tags pass through questions intact.
2. **End-to-End Flow**:
   - Upload sample .docx content.
   - Verify all 3 question types and images render cleanly in the right-hand preview.
   - Click Xuất bản đề thi, verify share modal pops up with correct URL, copy button, and QR code.
