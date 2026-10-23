# Task 2 Report: Vietnamese Exam & Math Parser Engine

## Overview
Successfully implemented the exam parser engine capable of parsing Vietnamese exams from raw text (and docx converted text) with question splitting, A/B/C/D option extraction, correct answer detection, explanation parsing, and LaTeX math formula normalization.

## Files Created & Configured
1. **`src/parser/mathConverter.ts`**:
   - `normalizeMathFormulas(text: string): string`
   - Normalizes non-breaking spaces and converts `\(...\)` to `$1$` and `\[...\]` to `$$$1$$`.
   - Preserves existing `$inline$` and `$$display$$` LaTeX formulas.
2. **`src/parser/examParser.ts`**:
   - `parseExamText(rawText: string, metadata?: Partial<Exam>): Exam`
   - Splits questions matching `(?:^|\n)(?:Câu|Bài|Question)\s*(\d+)[\s.:]+`.
   - Extracts question content, options A, B, C, D (including horizontal and multiline layouts).
   - Detects correct answer from:
     - Asterisk prefix (e.g., `*A.`)
     - Explicit answer line (e.g., `Đáp án: A`, `Chọn B`)
     - End-of-exam answer table (e.g., `BẢNG ĐÁP ÁN: 1.B 2.D 3.B`)
   - Extracts detailed explanations (`Lời giải:`, `Hướng dẫn giải:`, `Giải thích:`).
   - Automatically computes score per question (10 / totalQuestions).
3. **`tests/parser.test.ts`**:
   - Comprehensive test suite covering math conversion, standard 3-question exams, inline math formulas, asterisk answers, answer key table parsing, and solution explanations.

## Verification Results
- **Test execution**: `npx vitest run tests/parser.test.ts`
  - Result: 7 passed (100%), 0 failed
- **Full Suite**: `npx vitest run`
  - Result: 10 passed across 2 test files, 0 failed
- **Typecheck**: `npx tsc --noEmit`
  - Result: Exit code 0, 0 errors
