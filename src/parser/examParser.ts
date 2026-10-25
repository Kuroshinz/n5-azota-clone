/**
 * Accurately distribute a target total score (default: 10.00) across N questions
 * ensuring the sum of scores is EXACTLY targetTotalScore with zero round-off drift.
 * (e.g. for 68 questions: 48 questions receive 0.15 and 20 receive 0.14 -> exactly 10.00)
 */
export function distributeExamScores(totalQuestions: number, targetTotalScore = 10): number[] {
  if (totalQuestions <= 0) return [];
  const targetCents = Math.round(targetTotalScore * 100);
  const baseCents = Math.floor(targetCents / totalQuestions);
  const remainderCents = targetCents % totalQuestions;

  return Array.from({ length: totalQuestions }, (_, i) => {
    const cents = i < remainderCents ? baseCents + 1 : baseCents;
    return Number((cents / 100).toFixed(2));
  });
}

import { Exam, Option, OptionKey, Question, QuestionType, SubQuestionItem } from '../types/exam';
import { normalizeMathFormulas } from './mathConverter';

/**
 * Parses Vietnamese examination text (from plain text or DOCX conversion)
 * into a structured Exam domain model supporting Part I (Multiple Choice),
 * Part II (True/False with 4 sub-items), and Part III (Short Answer).
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
    text = text.substring(0, tableMatch.index).trim();
  }

  // Step 3: Split into question blocks
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

  // Filter out chapter/lesson headers (e.g. "Bài 1: Khái quát...") when followed immediately by Question 1
  const validBlocks = rawBlocks.filter((block, i) => {
    const next = rawBlocks[i + 1];
    const hasOptions = /(?:^|\n|\t|\s{2,}|(?<=[.!?,\)\]])\s+|\s+(?=[A-D][.:\)]))(\*?)[A-D][\s.:\)]+/i.test(block.rawText);
    const hasSubItems = /(?:^|\n|\t|\s{2,})[a-d][\s.:\)]+/i.test(block.rawText);
    const hasAnswer = /(?:^|\n)(?:Đáp án|Đáp số|Chọn|Key|Kết quả|ĐA)[\s.:]+/i.test(block.rawText);

    if (/^Bài\s*\d+/i.test(block.rawText) && !hasOptions && !hasSubItems && !hasAnswer && next && next.qNum === 1) {
      return false;
    }
    return true;
  });

  const totalQuestions = validBlocks.length;
  const questionScores = distributeExamScores(totalQuestions, 10);

  // Helper to test if a match is inside a markdown table row
  const isInsideMarkdownTable = (src: string, index: number) => {
    const lineStart = src.lastIndexOf('\n', index) + 1;
    let lineEnd = src.indexOf('\n', index);
    if (lineEnd === -1) lineEnd = src.length;
    const line = src.slice(lineStart, lineEnd).trim();
    return line.startsWith('|') && line.endsWith('|');
  };

  // Step 4: Parse each question block
  const questions: Question[] = validBlocks.map((block, index) => {
    let blockContent = block.rawText;
    let explanation: string | undefined = undefined;
    let detectedAnswer: OptionKey | undefined = undefined;
    let acceptedAnswers: string[] | undefined = undefined;
    let subItems: SubQuestionItem[] | undefined = undefined;

    // Check for explanation: Lời giải / Hướng dẫn giải / Giải thích / HDG
    const expMatch = blockContent.match(/(?:^|\n)(?:Lời giải|Hướng dẫn giải|Giải thích|HDG)[\s.:]+([\s\S]*)$/i);
    if (expMatch && expMatch.index !== undefined) {
      explanation = expMatch[1].trim();
      blockContent = blockContent.substring(0, expMatch.index).trim();
    }

    // Extract answer line if present: e.g. "Đáp án: A", "Đáp án: a) Đ, b) S", "Đáp số: 12.5", "ĐA. 3"
    let rawAnswerLine = '';
    const ansMatch = blockContent.match(/(?:^|\n)(?:Đáp án|Đáp số|Chọn|Key|Kết quả|ĐA)[\s.:]+([^\n\r]+)/i);
    if (ansMatch && ansMatch.index !== undefined) {
      rawAnswerLine = ansMatch[1].trim();
      blockContent = blockContent.substring(0, ansMatch.index) + blockContent.substring(ansMatch.index + ansMatch[0].length);
      blockContent = blockContent.trim();
    }

    // Remove the leading "Câu X:", "Bài X." header
    const headerPrefixMatch = blockContent.match(/^(?:Câu|Bài|Question)\s*\d+[\s.:]+\s*/i);
    if (headerPrefixMatch) {
      blockContent = blockContent.substring(headerPrefixMatch[0].length);
    }

    // Check for Part II True/False sub-items matching a), b), c), d)
    const subItemRegex = /(?:^|\n|\t|\s{2,})([a-d])[\s.:\)]+\s*/g;
    const subMatches: { index: number; length: number; key: 'a' | 'b' | 'c' | 'd' }[] = [];
    let subMatch: RegExpExecArray | null;

    while ((subMatch = subItemRegex.exec(blockContent)) !== null) {
      if (isInsideMarkdownTable(blockContent, subMatch.index)) continue;
      subMatches.push({
        index: subMatch.index,
        length: subMatch[0].length,
        key: subMatch[1].toLowerCase() as 'a' | 'b' | 'c' | 'd',
      });
    }

    // Check for Part I Multiple Choice options A, B, C, D (supports tabs, newlines, or multiple/single spaces before option)
    const optionRegex = /(?:^|\n|\t|\s{2,}|(?<=[.!?,\)\]])\s+|\s+(?=[A-D][.:\)]))(\*?)([A-D])[\s.:\)]+\s*/g;
    const optionMatches: { index: number; length: number; isAsterisk: boolean; key: OptionKey }[] = [];
    let optMatch: RegExpExecArray | null;

    while ((optMatch = optionRegex.exec(blockContent)) !== null) {
      if (isInsideMarkdownTable(blockContent, optMatch.index)) continue;
      optionMatches.push({
        index: optMatch.index,
        length: optMatch[0].length,
        isAsterisk: optMatch[1] === '*',
        key: optMatch[2].toUpperCase() as OptionKey,
      });
    }

    let questionType: QuestionType = 'multiple_choice';
    let questionContent = '';
    const options: Option[] = [];

    if (subMatches.length >= 2) {
      // Recognized as True/False (Part II)
      questionType = 'true_false';
      questionContent = blockContent.substring(0, subMatches[0].index).trim();
      subItems = [];

      // Parse answer map for True/False from rawAnswerLine
      const tfAnswersMap = new Map<string, boolean>();
      if (rawAnswerLine) {
        const tfRegex = /([a-d])[\s.:\)\-_]+([ĐS]|Đúng|Sai|True|False)(?=[,\s;]|$)/gi;
        let tfM: RegExpExecArray | null;
        while ((tfM = tfRegex.exec(rawAnswerLine)) !== null) {
          const k = tfM[1].toLowerCase();
          const v = tfM[2].toUpperCase();
          const isTrue = v === 'Đ' || v === 'ĐÚNG' || v === 'TRUE';
          tfAnswersMap.set(k, isTrue);
        }
      }

      for (let j = 0; j < subMatches.length; j++) {
        const curr = subMatches[j];
        const next = subMatches[j + 1];
        const start = curr.index + curr.length;
        const end = next ? next.index : blockContent.length;
        const subText = blockContent.substring(start, end).trim();

        subItems.push({
          key: curr.key,
          content: subText,
          correctAnswer: tfAnswersMap.get(curr.key),
        });
      }
    } else if (optionMatches.length > 0) {
      // Recognized as Multiple Choice (Part I)
      questionType = 'multiple_choice';
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

      if (!detectedAnswer && rawAnswerLine) {
        const directChoice = rawAnswerLine.match(/^([A-D])\b/i);
        if (directChoice) {
          detectedAnswer = directChoice[1].toUpperCase() as OptionKey;
        }
      }

      if (!detectedAnswer) {
        detectedAnswer = tableAnswers.get(block.qNum) || tableAnswers.get(index + 1);
      }
    } else {
      // Recognized as Short Answer (Part III)
      questionType = 'short_answer';
      questionContent = blockContent.trim();
      if (rawAnswerLine) {
        const cleanAns = rawAnswerLine.trim();
        acceptedAnswers = [cleanAns];
        if (cleanAns.includes(',')) {
          acceptedAnswers.push(cleanAns.replace(/,/g, '.'));
        }
      }
    }

    return {
      id: index + 1,
      type: questionType,
      rawText: block.rawText,
      content: questionContent,
      options,
      correctAnswer: detectedAnswer,
      subItems,
      acceptedAnswers,
      explanation,
      score: questionScores[index] ?? 0.25,
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
