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

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

export function normalizeQuestion(q: Question): Question {
  const updated: Question = { ...q };

  if (updated.type === 'multiple_choice' || (!updated.type && (updated.options?.length ?? 0) > 0)) {
    let opts = [...(updated.options || [])];

    opts = opts.filter(opt => {
      const cleanContent = (opt.content || '').trim().replace(/^[*A-D][.:)\-]\s*/i, '').trim();
      return cleanContent.length > 0;
    });

    opts = opts.map(opt => {
      let content = (opt.content || '').trim();
      content = content.replace(/^(\*?[A-D][.:)\-]\s*)+/i, '').trim();
      return { ...opt, content };
    });

    if (opts.length > 4) {
      const trueChoices = opts.slice(-4);
      const extraBodyOpts = opts.slice(0, -4);
      const extraBodyText = extraBodyOpts.map(o => o.key + '. ' + o.content).join('\n');
      if (extraBodyText) {
        updated.content = updated.content ? updated.content + '\n' + extraBodyText : extraBodyText;
      }
      opts = trueChoices;
    }

    const oldCorrect = updated.correctAnswer;
    let newCorrect = oldCorrect;
    opts = opts.map((opt, index) => {
      const standardKey = OPTION_KEYS[index] || ('D' as OptionKey);
      if (oldCorrect === opt.key && !newCorrect) newCorrect = standardKey;
      return { ...opt, key: standardKey };
    });

    if (newCorrect && !opts.some(o => o.key === newCorrect)) {
      newCorrect = opts[0]?.key || 'A';
    }

    updated.options = opts;
    updated.correctAnswer = newCorrect;
  } else if (updated.type === 'true_false') {
    const subKeys: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
    let subs = [...(updated.subItems || [])];
    subs = subs.filter(s => (s.content || '').trim().length > 0);
    subs = subs.map((s, index) => {
      let content = (s.content || '').trim();
      content = content.replace(/^(\*?[a-d][.:)\-]\s*)+/i, '').trim();
      return { ...s, key: subKeys[index] || ('d' as const), content };
    });
    updated.subItems = subs;
  }

  return updated;
}

export function normalizeExamQuestions(questions: Question[]): Question[] {
  return questions.map(normalizeQuestion);
}

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

  // Step 2: Extract document title if not explicitly provided
  let detectedTitle = metadata?.title;
  if (!detectedTitle || detectedTitle === 'Đề thi trắc nghiệm' || detectedTitle === 'Đề thi minh họa chuẩn GDPT 2018') {
    const titleMatch = text.match(/(?:^|\n)(?:ĐỀ\s+CƯƠNG|ĐỀ\s+THI|ĐỀ\s+KIỂM\s+TRA|BÀI\s+KIỂM\s+TRA|KIỂM\s+TRA)[^\n\r]+/i);
    if (titleMatch) {
      detectedTitle = titleMatch[0].trim();
    }
  }

  // Step 3: Extract end-of-file answer table if present (e.g., BẢNG ĐÁP ÁN)
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

  // Step 4: Split into question blocks
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

  // Step 5: Parse each question block
  const questions: Question[] = validBlocks.map((block, index) => {
    let blockContent = block.rawText;
    let explanation: string | undefined = undefined;
    let detectedAnswer: OptionKey | undefined = undefined;
    let acceptedAnswers: string[] | undefined = undefined;
    let subItems: SubQuestionItem[] | undefined = undefined;

    // Remove the leading "Câu X:", "Bài X." header
    const headerPrefixMatch = blockContent.match(/^(?:Câu|Bài|Question)\s*\d+[\s.:]+\s*/i);
    if (headerPrefixMatch) {
      blockContent = blockContent.substring(headerPrefixMatch[0].length);
    }

    // Step A: Check for Part II True/False sub-items BEFORE slicing out explanations!
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

    // Check if the block has True/False answer markers (e.g. "[ĐÚNG]", "[SAI]", "Đáp án: a) Đ", etc.)
    const hasTfIndicators = /(?:\[\s*(?:ĐÚNG|SAI|TRUE|FALSE|Đ|S)\s*\]|[→\-—\:]\s*(?:ĐÚNG|SAI|TRUE|FALSE)|(?:Đáp án|Key)[\s.:]+[a-d][\s.:\)\-_]+[ĐS])/i.test(blockContent);

    let questionType: QuestionType = 'multiple_choice';
    let questionContent = '';
    const options: Option[] = [];

    if (subMatches.length >= 2 && hasTfIndicators) {
      // Recognized as Part II True/False
      questionType = 'true_false';
      questionContent = blockContent.substring(0, subMatches[0].index).trim();
      subItems = [];
      const tfExplanations: string[] = [];

      // Parse external answer line if present (e.g. "Đáp án: a) Đ, b) S, c) Đ, d) S")
      const tfAnswersMap = new Map<string, boolean>();
      const ansMatch = blockContent.match(/(?:^|\n)(?:Đáp án|Đáp số|Chọn|Key|Kết quả|ĐA)[\s.:]+([^\n\r]+)/i);
      if (ansMatch) {
        const tfRegex = /([a-d])[\s.:\)\-_]+([ĐS]|Đúng|Sai|True|False)(?=[,\s;]|$)/gi;
        let tfM: RegExpExecArray | null;
        while ((tfM = tfRegex.exec(ansMatch[1])) !== null) {
          const k = tfM[1].toLowerCase();
          const v = tfM[2].toUpperCase();
          const isTrue = v === 'Đ' || v === 'ĐÚNG' || v === 'TRUE';
          tfAnswersMap.set(k, isTrue);
        }
      }

      for (let j = 0; j < subMatches.length; j++) {
        const curr = subMatches[j];
        const next = subMatches[j + 1];
        const rawChunk = blockContent.substring(curr.index + curr.length, next ? next.index : blockContent.length).trim();

        let itemText = rawChunk;
        // Check for per-item explanation: "Giải thích: ..." or "Lời giải: ..."
        const expM = rawChunk.match(/(?:^|\n)(?:Lời giải(?:\s+chi\s+tiết)?|Giải thích|Hướng dẫn giải|HDG)[\s.:]+([\s\S]*)$/i);
        if (expM && expM.index !== undefined) {
          itemText = rawChunk.substring(0, expM.index).trim();
          const itemExpl = expM[1].trim();
          tfExplanations.push(`${curr.key}) ${itemExpl}`);
        }

        // Check for inline answer: e.g. "→ [ĐÚNG]", "-> [SAI]", "[ĐÚNG]", "[SAI]", "→ ĐÚNG"
        let itemAnswer: boolean | undefined = undefined;
        const ansM = itemText.match(/(?:[→\-—\:]*\s*\[?(ĐÚNG|SAI|TRUE|FALSE|Đ|S)\]?)\s*$/i);
        if (ansM) {
          const v = ansM[1].toUpperCase();
          itemAnswer = v === 'Đ' || v === 'ĐÚNG' || v === 'TRUE';
          itemText = itemText.substring(0, ansM.index).trim();
        } else {
          itemAnswer = tfAnswersMap.get(curr.key);
        }

        subItems.push({
          key: curr.key,
          content: itemText,
          correctAnswer: itemAnswer,
        });
      }

      if (tfExplanations.length > 0) {
        explanation = tfExplanations.join('\n');
      }
    } else {
      // Step B: For Part I Multiple Choice and Part III Short Answer
      const expMatch = blockContent.match(/(?:^|\n)(?:Lời giải(?:\s+chi\s+tiết)?|Hướng dẫn giải|Giải thích|HDG)[\s.:]+([\s\S]*)$/i);
      if (expMatch && expMatch.index !== undefined) {
        explanation = expMatch[1].trim();
        blockContent = blockContent.substring(0, expMatch.index).trim();
      }

      let rawAnswerLine = '';
      const ansMatch = blockContent.match(/(?:^|\n)(?:Đáp án|Đáp số|Chọn|Key|Kết quả|ĐA)[\s.:]+([^\n\r]+)/i);
      if (ansMatch && ansMatch.index !== undefined) {
        rawAnswerLine = ansMatch[1].trim();
        blockContent = blockContent.substring(0, ansMatch.index) + blockContent.substring(ansMatch.index + ansMatch[0].length);
        blockContent = blockContent.trim();
      }

      // Check for MC options A, B, C, D
      const optionRegex = /(?:^|\n|\t+|(?<=[^\n])\s{2,})(\*?)([A-D])[\s.:)\-]+\s*/g;
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

      
      // Smart candidate cluster selection:
      // If there are multiple matches (e.g. data table ion A, B, C before prompt),
      // pick the final cluster starting from the last 'A' match that has subsequent choices.
      if (optionMatches.length > 0) {
        const lastAIdx = optionMatches.map(m => m.key).lastIndexOf('A');
        if (lastAIdx !== -1 && lastAIdx < optionMatches.length) {
          const tailCluster = optionMatches.slice(lastAIdx);
          if (tailCluster.length >= 2) {
            optionMatches.length = 0;
            optionMatches.push(...tailCluster);
          }
        }
      }
if (optionMatches.length > 0) {
        questionType = 'multiple_choice';
        questionContent = blockContent.substring(0, optionMatches[0].index).trim();

        for (let j = 0; j < optionMatches.length; j++) {
          const currOpt = optionMatches[j];
          const nextOpt = optionMatches[j + 1];
          const optStart = currOpt.index + currOpt.length;
          const optEnd = nextOpt ? nextOpt.index : blockContent.length;
          let optText = blockContent.substring(optStart, optEnd).trim();
          optText = optText.replace(/^(\*?[A-D][.:)\-]\s*)+/i, '').trim();
          if (optText.length === 0 && j < optionMatches.length - 1) continue;

          if (currOpt.isAsterisk) {
            detectedAnswer = currOpt.key;
          }

          options.push({
            key: currOpt.key,
            content: optText,
          });
        }

        
        const nonEmptyOpts = options.filter(o => o.content.trim().length > 0);
        if (nonEmptyOpts.length >= 2) {
          options.length = 0;
          options.push(...nonEmptyOpts);
        }
        const stdKeys: OptionKey[] = ['A', 'B', 'C', 'D'];
        options.forEach((o, idx) => { o.key = stdKeys[idx] || 'D'; });
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

          // If answer contains decimals with comma: "12,5" -> add "12.5"
          if (cleanAns.includes(',')) {
            acceptedAnswers.push(cleanAns.replace(/,/g, '.'));
          }

          // If answer contains extra text like "3 (Đáp án C)" or "150 - 200 bar (hoặc 200)"
          const leadingNum = cleanAns.match(/^([0-9.,]+)/);
          if (leadingNum && !acceptedAnswers.includes(leadingNum[1])) {
            acceptedAnswers.push(leadingNum[1]);
          }

          const altMatch = cleanAns.match(/\(hoặc\s+([^)]+)\)/i);
          if (altMatch && !acceptedAnswers.includes(altMatch[1].trim())) {
            acceptedAnswers.push(altMatch[1].trim());
          }
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
    title: detectedTitle || 'Đề thi trắc nghiệm',
    durationMinutes: metadata?.durationMinutes || 45,
    totalQuestions: questions.length,
    questions: normalizeExamQuestions(questions),
    createdAt: metadata?.createdAt || new Date().toISOString(),
  };
}
