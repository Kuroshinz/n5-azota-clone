import { Question } from '../types/exam';

/**
 * Universal Math, Physics, and Chemistry Formula Normalizer
 * Standardizes LaTeX math delimiters, converts raw Vietnamese shorthand notations
 * (căn, pi, v_0, m/s^2, 10^-3) into valid KaTeX expressions,
 * and fixes chemical formulas and equations across all subjects.
 */

/**
 * Formats a raw chemical formula string (e.g. "CO2", "H2SO4", "Fe3O4")
 * into valid KaTeX markup using \mathrm{...} (Roman math mode)
 * e.g. "CO2" -> "\mathrm{CO_2}"
 * e.g. "H2SO4" -> "\mathrm{H_2SO_4}"
 * e.g. "Fe3O4" -> "\mathrm{Fe_3O_4}"
 */
export function formatChemicalFormula(formula: string): string {
  const latexSub = formula.replace(/([A-Za-z\(\)])(\d+)/g, '$1_$2');
  return `\\mathrm{${latexSub}}`;
}

/**
 * Sanitizes LaTeX formulas before rendering in KaTeX.
 * Resolves KaTeX parse error: "Expected 'EOF', got '_' at position ... \text{CO_2}"
 * by converting invalid text-mode subscripts \text{..._...} into valid Roman math \mathrm{..._...}
 */
export function sanitizeLatexFormula(formula: string): string {
  if (!formula) return '';
  let f = formula;

  // Convert any \text{..._...} or \text{...^...} into \mathrm{...}
  f = f.replace(/\\text\{([A-Za-z0-9_\^\(\)]*[_^][A-Za-z0-9_\^\(\)]*)\}/g, '\\mathrm{$1}');

  return f;
}

/**
 * Normalizes LaTeX math formulas, delimiters, physics shorthand, and chemistry formulas.
 */
export function normalizeMathFormulas(rawText: string): string {
  if (!rawText) return '';

  let text = rawText
    // Replace non-breaking spaces with standard space
    .replace(/\u00A0/g, ' ')
    // Convert \[ ... \] display math to $$ ... $$
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `$$${inner}$$`)
    // Convert \( ... \) inline math to $ ... $
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${inner}$`)
    // Convert \begin{equation} ... \end{equation} to $$ ... $$
    .replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (_m, inner) => `$$${inner}$$`);

  // 1. Normalize Greek letters in text (π, ω, λ, Δ, Ω, μ, α, β, θ, φ)
  text = text
    .replace(/(?<![a-zA-Z\\])π(?![a-zA-Z])/g, '\\pi')
    .replace(/(?<![a-zA-Z\\])ω(?![a-zA-Z])/g, '\\omega')
    .replace(/(?<![a-zA-Z\\])λ(?![a-zA-Z])/g, '\\lambda')
    .replace(/(?<![a-zA-Z\\])Δ(?![a-zA-Z])/g, '\\Delta')
    .replace(/(?<![a-zA-Z\\])Ω(?![a-zA-Z])/g, '\\Omega')
    .replace(/(?<![a-zA-Z\\])μ(?=[a-zA-Z])/g, '\\mu ')
    .replace(/(?<![a-zA-Z\\])α(?![a-zA-Z])/g, '\\alpha')
    .replace(/(?<![a-zA-Z\\])β(?![a-zA-Z])/g, '\\beta')
    .replace(/(?<![a-zA-Z\\])θ(?![a-zA-Z])/g, '\\theta')
    .replace(/(?<![a-zA-Z\\])φ(?![a-zA-Z])/g, '\\varphi');

  // 2. Physics & Math: Shorthand root fractions
  text = text.replace(
    /(?:căn|√|\\sqrt)\s*(?:\(|\{)\s*([a-zA-Z0-9_\+\-\*\^\s]+)\s*\/\s*([a-zA-Z0-9_\+\-\*\^\s]+)\s*(?:\)|\})/gi,
    (_match, num, den) => `\\sqrt{\\frac{${num.trim()}}{${den.trim()}}}`
  );

  // General roots: "căn(x)" or "√(x)" -> "\sqrt{x}"
  text = text.replace(/(?:căn|√)\s*\(\s*([^()]+)\s*\)/gi, (_match, inner) => `\\sqrt{${inner.trim()}}`);
  text = text.replace(/(?:căn|√)\s+([a-zA-Z0-9_]+)/gi, (_match, inner) => `\\sqrt{${inner.trim()}}`);

  // 3. Common Physics Formula Prefix Normalization
  text = text.replace(/\b2\s*pi\b/gi, '2\\pi');
  text = text.replace(/\b1\s*\/\s*\(?2\s*pi\)?/gi, '\\frac{1}{2\\pi}');
  text = text.replace(/\b1\s*\/\s*\(?2\s*\\pi\)?/gi, '\\frac{1}{2\\pi}');
  text = text.replace(/(\\pi)\s*\*\s*(\\sqrt)/g, '$1$2');
  text = text.replace(/(?<![a-zA-Z0-9$])1\/2\s*(?=[a-zA-Z\\])/g, '\\frac{1}{2}');

  // 4. Wrap unwrapped mathematical expressions containing \pi, \sqrt, \frac, \omega, etc.
  text = text.replace(
    /(?<!\$)\b([a-zA-Z0-9_]+\s*=\s*(?:[^\n$]+?\\(?:sqrt|frac|pi|omega|lambda)[^\n$]*))(?!\$)/g,
    (_match, expr) => {
      const cleanExpr = expr.replace(/[.,;:]$/, '');
      const trailingPunct = expr.slice(cleanExpr.length);
      return `$${cleanExpr.trim()}$${trailingPunct}`;
    }
  );

  // 5. Scientific notation & Powers of 10: "10^-3", "10^8"
  text = text.replace(
    /(?<![0-9a-zA-Z$\\])10\^(-?\d+)(?![0-9a-zA-Z$])/g,
    (_match, exp) => `$10^{${exp}}$`
  );
  text = text.replace(
    /(?<![a-zA-Z$\\])(\d+(?:\.\d+)?)\s*[x×*]\s*\$10\^\{(-?\d+)\}\$/g,
    (_match, coeff, exp) => `$${coeff} \\times 10^{${exp}}$`
  );

  // 6. Physics Units
  text = text.replace(/(?<![a-zA-Z0-9$\\])m\/s\^2(?![a-zA-Z0-9$])/g, '$\\text{m/s}^2$');
  text = text.replace(/(?<![a-zA-Z0-9$\\])cm\/s\^2(?![a-zA-Z0-9$])/g, '$\\text{cm/s}^2$');
  text = text.replace(/(?<![a-zA-Z0-9$\\])rad\/s(?![a-zA-Z0-9$])/g, '$\\text{rad/s}$');
  text = text.replace(/(?<![a-zA-Z0-9$\\])kg\.m\/s(?![a-zA-Z0-9$])/g, '$\\text{kg}\\cdot\\text{m/s}$');
  text = text.replace(/(?<![a-zA-Z0-9$\\])\\Omega(?![a-zA-Z0-9$])/g, '$\\Omega$');
  text = text.replace(/(?<![a-zA-Z0-9$\\])k\\Omega(?![a-zA-Z0-9$])/g, '$\\text{k}\\Omega$');
  text = text.replace(/(?<![a-zA-Z0-9$\\])M\\Omega(?![a-zA-Z0-9$])/g, '$\\text{M}\\Omega$');

  // 7. Fix Unicode chemical subscripts (e.g. CO₂, O₂, H₂O, SO₄)
  const unicodeSubMap: Record<string, string> = {
    '\u2080': '0', '\u2081': '1', '\u2082': '2', '\u2083': '3', '\u2084': '4',
    '\u2085': '5', '\u2086': '6', '\u2087': '7', '\u2088': '8', '\u2089': '9',
  };
  text = text.replace(/\b([A-Z][A-Za-z\(\)]*)([\u2080-\u2089]+)/g, (_match, elem, subs) => {
    const num = subs.split('').map((c: string) => unicodeSubMap[c] || c).join('');
    return `$\\mathrm{${elem}_${num}}$`;
  });

  // 8. Chemistry Formulas: Automatic subscripts for common chemical compounds
  const CHEM_REGEX = /\b(H2SO4|HNO3|HCl|H2O|CO2|SO2|SO3|CaCO3|BaSO4|Fe3O4|Fe2O3|FeO|CuSO4|KMnO4|Al2O3|NaOH|KOH|Ca\(OH\)2|Ba\(OH\)2|Na2CO3|NaHCO3|CH4|C2H4|C2H2|C6H6|C2H5OH|CH3COOH|NaCl|O2|N2|H2|Cl2|Fe\(OH\)3|Fe\(OH\)2|Al\(OH\)3|Al2\(SO4\)3|Fe2\(SO4\)3|FeSO4|Cu\(OH\)2)\b/g;

  text = text.replace(CHEM_REGEX, (match, _p1, offset, str) => {
    const before = str.slice(0, offset);
    const dollarCount = (before.match(/\$/g) || []).length;
    if (dollarCount % 2 === 1) return match;
    if (/\\(?:text|mathrm|mathbf)\s*\{[^}]*$/.test(before)) return match;

    const formatted = formatChemicalFormula(match);
    return `$${formatted}$`;
  });

  // 9. Fix broken \text{CO_2} or \text{O_2} where subscript was placed inside \text{...} -> convert to \mathrm{...}
  text = text.replace(/\\text\{([A-Za-z0-9_\^\(\)]*[_^][A-Za-z0-9_\^\(\)]*)\}/g, '\\mathrm{$1}');

  // 10. Wrap unwrapped chemical formulas or LaTeX commands sitting in plain text outside $...$
  text = text.replace(/(?<!\$)\\(?:text|mathrm)\{[A-Za-z0-9_\^\(\)]+\}(?!\$)/g, (m) => `$${m}$`);

  // Chemistry Reaction Arrows outside $
  text = text.replace(/(?<=\s)->(?=\s)/g, '$\\to$');
  text = text.replace(/(?<=\s)-->(?=\s)/g, '$\\to$');
  text = text.replace(/(?<=\s)<=>\s*(?=\s)/g, '$\\rightleftharpoons$');

  // 11. Clean up empty inline math e.g. "$   $" but preserve display math "$$...$$"
  text = text.replace(/(?<!\$)\$\s+\$(?!\$)/g, '');

  return text;
}

/**
 * Checks if a string contains known formula or character formatting issues
 * (e.g. invalid KaTeX \text{..._...}, unwrapped \text{, raw unicode subscripts, etc.)
 */
export function hasFormulaOrCharacterIssue(text: string): boolean {
  if (!text) return false;
  // Has \text{..._...}
  if (/\\text\{[^\}]*_[^\}]*\}/.test(text)) return true;
  // Has unwrapped \mathrm{CO_2} or \text{CO_2}
  if (/(?<!\$)\\(?:text|mathrm)\{[A-Za-z0-9_\^\(\)]+\}(?!\$)/.test(text)) return true;
  // Has unicode chemical subscripts e.g. CO₂, O₂
  if (/\b[A-Z][A-Za-z\(\)]*[\u2080-\u2089]+/.test(text)) return true;
  // Has raw chemistry formulas e.g. CO2, H2O, O2 outside $
  const CHEM_CHECK = /\b(H2SO4|HNO3|H2O|CO2|SO2|SO3|CaCO3|Fe3O4|Fe2O3|Al2O3|O2|N2|H2|Cl2)\b/;
  if (CHEM_CHECK.test(text)) {
    const m = text.match(CHEM_CHECK);
    if (m && m.index !== undefined) {
      const before = text.slice(0, m.index);
      const dollarCount = (before.match(/\$/g) || []).length;
      if (dollarCount % 2 === 0) return true;
    }
  }
  return false;
}

/**
 * Fixes all formula and character issues in a string.
 */
export function fixFormulaAndCharacterErrors(text: string): { text: string; changed: boolean } {
  if (!text) return { text: '', changed: false };
  const normalized = normalizeMathFormulas(text);
  return {
    text: normalized,
    changed: normalized !== text,
  };
}

/**
 * Fixes character/formula issues across a Question object.
 */
export function fixQuestionFormulaErrors(question: Question): { question: Question; fixedCount: number } {
  let fixedCount = 0;
  const updated: Question = { ...question };

  // 1. Content
  if (updated.content) {
    const res = fixFormulaAndCharacterErrors(updated.content);
    if (res.changed) {
      updated.content = res.text;
      fixedCount++;
    }
  }

  // 2. Explanation
  if (updated.explanation) {
    const res = fixFormulaAndCharacterErrors(updated.explanation);
    if (res.changed) {
      updated.explanation = res.text;
      fixedCount++;
    }
  }

  // 3. Options
  if (updated.options && updated.options.length > 0) {
    updated.options = updated.options.map((opt) => {
      const res = fixFormulaAndCharacterErrors(opt.content);
      if (res.changed) {
        fixedCount++;
        return { ...opt, content: res.text };
      }
      return opt;
    });
  }

  // 4. SubItems (Part II)
  if (updated.subItems && updated.subItems.length > 0) {
    updated.subItems = updated.subItems.map((sub) => {
      const res = fixFormulaAndCharacterErrors(sub.content);
      if (res.changed) {
        fixedCount++;
        return { ...sub, content: res.text };
      }
      return sub;
    });
  }

  return { question: updated, fixedCount };
}

/**
 * Batch fixes character/formula issues across all questions in an exam.
 */
export function fixExamQuestionsCharacters(questions: Question[]): {
  questions: Question[];
  fixedQuestionsCount: number;
  totalErrorsFixed: number;
} {
  let fixedQuestionsCount = 0;
  let totalErrorsFixed = 0;

  const nextQuestions = questions.map((q) => {
    const res = fixQuestionFormulaErrors(q);
    if (res.fixedCount > 0) {
      fixedQuestionsCount++;
      totalErrorsFixed += res.fixedCount;
    }
    return res.question;
  });

  return {
    questions: nextQuestions,
    fixedQuestionsCount,
    totalErrorsFixed,
  };
}
