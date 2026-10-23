/**
 * Normalizes LaTeX math formulas and converts Word / LaTeX equation delimiters into KaTeX compatible delimiters.
 */
export function normalizeMathFormulas(text: string): string {
  if (!text) return '';

  return text
    // Replace non-breaking spaces with standard space
    .replace(/\u00A0/g, ' ')
    // Convert \[ ... \] display math to $$ ... $$
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    // Convert \( ... \) inline math to $ ... $
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
}
