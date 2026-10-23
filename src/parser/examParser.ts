import { Exam, Option, OptionKey, Question } from '../types/exam';
import { normalizeMathFormulas } from './mathConverter';

/**
 * Parses Vietnamese examination text (from plain text or DOCX conversion)
 * into a structured Exam domain model.
 */
export function parseExamText(rawText: string, metadata?: Partial<Exam>): Exam {
  if (!rawText || !rawText.trim()) {
    return {
      id: metadata?.id || `exam-${Date.now()}`,
      title: metadata?.title || 'Đề thi trắc nghiệm',
      durationMinutes: metadata?.durationMinutes || 45,
      totalQuestions: 0,
      questions: [],
      createdAt: metadata?.createdAt || new Date().toISOString(),
    };
  }

  // Step 1: Normalize formulas
  let text = normalizeMathFormulas(rawText.trim());

  // Step 2: Extract end-of-file answer table if present (e.g., BẢNG ĐÁP ÁN)
  const tableAnswers = new Map<number, OptionKey>();
  const tableMatch = text.match(/(?:^|\n)(?:BẢNG ĐÁP ÁN|BẢNG TRẢ LỜI|ANSWER KEY)[\s.:]*\n*([\s\S]*)$/i);
  if (tableMatch && tableMatch.index !== undefined) {
    const tableContent = tableMatch[1];
    const pairRegex = /(\d+)[\s.:\-_]*([A-D])\b/gi;
    let pMatch: RegExpExecArray | null;
    while ((pMatch = pairRegex.exec(tableContent)) !== null) {
      const qNum = parseInt(pMatch[1], 10);
      const optKey = pMatch[2].toUpperCase() as OptionKey;
      tableAnswers.set(qNum, optKey);
    }
    // Remove the answer table from text so it doesn't pollute the questions
    text = text.substring(0, tableMatch.index).trim();
  }

  // Step 3: Split into question blocks
  // Matches "Câu 1:", "Bài 1.", "Question 1:", etc.
  const questionHeaderRegex = /(?:^|\n)(?:Câu|Bài|Question)\s*(\d+)[\s.:]+/gi;
  const matches: { index: number; length: number; qNum: number }[] = [];
  let qMatch: RegExpExecArray | null;

  while ((qMatch = questionHeaderRegex.exec(text)) !== null) {
    matches.push({
      index: qMatch.index,
      length: qMatch[0].length,
      qNum: parseInt(qMatch[1], 10),
    });
  }

  const rawBlocks: { qNum: number; rawText: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const blockText = next
      ? text.substring(current.index, next.index)
      : text.substring(current.index);

    rawBlocks.push({
      qNum: current.qNum,
      rawText: blockText.trim(),
    });
  }

  const totalQuestions = rawBlocks.length;
  const scorePerQuestion = totalQuestions > 0 ? Number((10 / totalQuestions).toFixed(2)) : 0;

  // Step 4: Parse each question block
  const questions: Question[] = rawBlocks.map((block, index) => {
    let blockContent = block.rawText;
    let explanation: string | undefined = undefined;
    let detectedAnswer: OptionKey | undefined = undefined;

    // Check for explanation: Lời giải / Hướng dẫn giải / Giải thích
    const expMatch = blockContent.match(/(?:^|\n)(?:Lời giải|Hướng dẫn giải|Giải thích)[\s.:]+([\s\S]*)$/i);
    if (expMatch && expMatch.index !== undefined) {
      explanation = expMatch[1].trim();
      blockContent = blockContent.substring(0, expMatch.index).trim();
    }

    // Check for explicit answer line: "Đáp án: A", "Chọn B", "Key: C"
    const ansMatch = blockContent.match(/(?:^|\n)(?:Đáp án|Chọn|Key)[\s.:]+([A-D])\b/i);
    if (ansMatch && ansMatch.index !== undefined) {
      detectedAnswer = ansMatch[1].toUpperCase() as OptionKey;
      blockContent = blockContent.substring(0, ansMatch.index) + blockContent.substring(ansMatch.index + ansMatch[0].length);
      blockContent = blockContent.trim();
    }

    // Remove the leading "Câu X:", "Bài X." header from the question content
    const headerPrefixMatch = blockContent.match(/^(?:Câu|Bài|Question)\s*\d+[\s.:]+\s*/i);
    if (headerPrefixMatch) {
      blockContent = blockContent.substring(headerPrefixMatch[0].length);
    }

    // Find options A, B, C, D (and asterisk *A, *B, etc.)
    const optionRegex = /(?:^|\n|\s{2,})(\*?)([A-D])[\s.:\)]+\s*/g;
    const optionMatches: { index: number; length: number; isAsterisk: boolean; key: OptionKey }[] = [];
    let optMatch: RegExpExecArray | null;

    while ((optMatch = optionRegex.exec(blockContent)) !== null) {
      optionMatches.push({
        index: optMatch.index,
        length: optMatch[0].length,
        isAsterisk: optMatch[1] === '*',
        key: optMatch[2].toUpperCase() as OptionKey,
      });
    }

    let questionContent = '';
    const options: Option[] = [];

    if (optionMatches.length > 0) {
      questionContent = blockContent.substring(0, optionMatches[0].index).trim();

      for (let j = 0; j < optionMatches.length; j++) {
        const currOpt = optionMatches[j];
        const nextOpt = optionMatches[j + 1];
        const optStart = currOpt.index + currOpt.length;
        const optEnd = nextOpt ? nextOpt.index : blockContent.length;
        const optText = blockContent.substring(optStart, optEnd).trim();

        if (currOpt.isAsterisk) {
          detectedAnswer = currOpt.key;
        }

        options.push({
          key: currOpt.key,
          content: optText,
        });
      }
    } else {
      questionContent = blockContent.trim();
    }

    // Fallback to table answers if answer wasn't detected inside the question
    if (!detectedAnswer) {
      detectedAnswer = tableAnswers.get(block.qNum) || tableAnswers.get(index + 1);
    }

    return {
      id: index + 1,
      rawText: block.rawText,
      content: questionContent,
      options,
      correctAnswer: detectedAnswer,
      explanation,
      score: scorePerQuestion,
    };
  });

  return {
    id: metadata?.id || `exam-${Date.now()}`,
    title: metadata?.title || 'Đề thi trắc nghiệm',
    durationMinutes: metadata?.durationMinutes || 45,
    totalQuestions: questions.length,
    questions,
    createdAt: metadata?.createdAt || new Date().toISOString(),
  };
}
