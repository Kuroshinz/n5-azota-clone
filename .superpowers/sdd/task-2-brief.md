# Task 2 Brief: Vietnamese Exam & Math Parser Engine

## Goal
Implement the exam parser engine capable of parsing Vietnamese exams from raw text (and docx converted text) with question splitting, A/B/C/D option extraction, correct answer detection, explanation parsing, and LaTeX math formula normalization.

## Files to Create
- `D:/Download/azota-clone/src/parser/mathConverter.ts`
- `D:/Download/azota-clone/src/parser/examParser.ts`
- `D:/Download/azota-clone/tests/parser.test.ts`

## Requirements
1. `src/parser/mathConverter.ts`:
   - `normalizeMathFormulas(text: string): string`
   - Converts `\\((.*?)\\)` to `$$$1$$`
   - Converts `\\[(.*?)\\]` to `$$$$$1$$$$`
   - Preserves existing `$inline$` and `$$display$$` LaTeX formulas
   - Strips unneeded word artifacts
2. `src/parser/examParser.ts`:
   - `parseExamText(rawText: string, metadata?: Partial<Exam>): Exam`
   - Splits questions matching: `(?:^|\n)(?:Câu|Bài|Question)\s*(\d+)[\s.:]+`
   - Within each question block:
     - Extracts question content (before options)
     - Extracts options A, B, C, D: matching `(?:^|\n|\s{2,})([A-D])[\s.:\)]+\s*([^\n\r]+)`
     - Detects correct answer from:
       - Asterisk prefix: e.g. `*A. Đáp án đúng`
       - Explicit answer line: e.g. `Đáp án: B` or `Chọn C`
       - Or an Answer Key section at the end: `BẢNG ĐÁP ÁN:\n1.A 2.B 3.C...` or `1-A, 2-B...`
     - Extracts explanation if present: `(?:Lời giải|Hướng dẫn giải|Giải thích)[\s.:]+([\s\S]*)$`
   - Assigns question ids (1..N), score per question (10 / totalQuestions by default, rounded to 2 decimals)
   - Returns full `Exam` object matching `src/types/exam.ts`
3. `tests/parser.test.ts`:
   - Test 1: Standard 3-question Vietnamese test with A/B/C/D
   - Test 2: Questions containing math formulas `$f(x) = \frac{x^2+1}{x-1}$`
   - Test 3: Correct answer marked with `*A.` asterisk format
   - Test 4: End-of-file answer table parsing (`BẢNG ĐÁP ÁN: 1-A 2-B 3-C`)
   - Test 5: Question with explanation (`Lời giải: ...`)
4. Verification:
   - Run `npx vitest run tests/parser.test.ts`
   - Ensure all tests pass.
   - Commit with `git add . && git commit -m "feat: implement vietnamese exam and math parser engine"`
