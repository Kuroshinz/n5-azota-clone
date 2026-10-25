/**
 * Universal Math, Physics, and Chemistry Formula Normalizer
 * Standardizes LaTeX math delimiters, converts raw Vietnamese shorthand notations
 * (căn, pi, v_0, m/s^2, 10^-3) into valid KaTeX expressions,
 * and fixes chemical formulas and equations across all subjects.
 */

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
  // e.g., "căn(m/k)", "√(m/k)", "\sqrt(m/k)", "\sqrt{m/k}" -> "\sqrt{\frac{m}{k}}"
  text = text.replace(
    /(?:căn|√|\\sqrt)\s*(?:\(|\{)\s*([a-zA-Z0-9_\+\-\*\^\s]+)\s*\/\s*([a-zA-Z0-9_\+\-\*\^\s]+)\s*(?:\)|\})/gi,
    (_match, num, den) => `\\sqrt{\\frac{${num.trim()}}{${den.trim()}}}`
  );

  // General roots: "căn(x)" or "√(x)" -> "\sqrt{x}"
  text = text.replace(/(?:căn|√)\s*\(\s*([^()]+)\s*\)/gi, (_match, inner) => `\\sqrt{${inner.trim()}}`);
  text = text.replace(/(?:căn|√)\s+([a-zA-Z0-9_]+)/gi, (_match, inner) => `\\sqrt{${inner.trim()}}`);

  // 3. Common Physics Formula Prefix Normalization
  // e.g. "2pi" or "2\pi"
  text = text.replace(/\b2\s*pi\b/gi, '2\\pi');
  text = text.replace(/\b1\s*\/\s*\(?2\s*pi\)?/gi, '\\frac{1}{2\\pi}');
  text = text.replace(/\b1\s*\/\s*\(?2\s*\\pi\)?/gi, '\\frac{1}{2\\pi}');

  // Remove unnecessary multiplication asterisks before \sqrt e.g. "2\pi * \sqrt" -> "2\pi\sqrt"
  text = text.replace(/(\\pi)\s*\*\s*(\\sqrt)/g, '$1$2');

  // Fractions in simple divisions outside words: "1/2" before variables
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

  // 7. Chemistry Formulas: Automatic subscripts for common chemical compounds
  const CHEM_REGEX = /\b(H2SO4|HNO3|HCl|H2O|CO2|SO2|SO3|CaCO3|BaSO4|Fe3O4|Fe2O3|FeO|CuSO4|KMnO4|Al2O3|NaOH|KOH|Ca\(OH\)2|Ba\(OH\)2|Na2CO3|NaHCO3|CH4|C2H4|C2H2|C6H6|C2H5OH|CH3COOH|NaCl|O2|N2|H2|Cl2|Fe\(OH\)3|Fe\(OH\)2|Al\(OH\)3|Al2\(SO4\)3|Fe2\(SO4\)3|FeSO4|Cu\(OH\)2)\b/g;

  text = text.replace(CHEM_REGEX, (match) => {
    // Convert numbers after elements to subscript: e.g. H2SO4 -> \text{H}_2\text{SO}_4
    const latexSub = match.replace(/([A-Za-z\(\)])(\d+)/g, '$1_$2');
    return `$\\text{${latexSub}}$`;
  });

  // Chemistry Reaction Arrows outside $
  text = text.replace(/(?<=\s)->(?=\s)/g, '$\\to$');
  text = text.replace(/(?<=\s)-->(?=\s)/g, '$\\to$');
  text = text.replace(/(?<=\s)<=>\s*(?=\s)/g, '$\\rightleftharpoons$');

  // 8. Clean up empty inline math e.g. "$   $" but preserve display math "$$...$$"
  text = text.replace(/(?<!\$)\$\s+\$(?!\$)/g, '');

  return text;
}
