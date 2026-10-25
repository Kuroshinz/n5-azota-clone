/**
 * OMML (Office Math Markup Language) to LaTeX Converter
 * Parses Word native math equations (<m:oMath>, <m:oMathPara>) and transforms them
 * into KaTeX-compatible LaTeX formulas ($ ... $ or $$ ... $$).
 */

import { DOMParser } from '@xmldom/xmldom';

const GREEK_AND_MATH_SYMBOLS: Record<string, string> = {
  'α': '\\alpha',
  'β': '\\beta',
  'γ': '\\gamma',
  'δ': '\\delta',
  'Δ': '\\Delta',
  'ε': '\\varepsilon',
  'θ': '\\theta',
  'λ': '\\lambda',
  'Λ': '\\Lambda',
  'μ': '\\mu',
  'π': '\\pi',
  'Π': '\\Pi',
  'ρ': '\\rho',
  'σ': '\\sigma',
  'Σ': '\\Sigma',
  'τ': '\\tau',
  'φ': '\\varphi',
  'Φ': '\\Phi',
  'ω': '\\omega',
  'Ω': '\\Omega',
  '±': '\\pm',
  '×': '\\times',
  '÷': '\\div',
  '≠': '\\ne',
  '≤': '\\le',
  '≥': '\\ge',
  '≈': '\\approx',
  '∞': '\\infty',
  '→': '\\to',
  '←': '\\gets',
  '↔': '\\leftrightarrow',
  '⇄': '\\rightleftharpoons',
  '°': '^\\circ',
  '⊥': '\\perp',
  '∥': '\\parallel',
};

function normalizeMathText(text: string): string {
  if (!text) return '';
  let res = '';
  for (const char of text) {
    if (GREEK_AND_MATH_SYMBOLS[char]) {
      res += (res.endsWith(' ') || res === '' ? '' : ' ') + GREEK_AND_MATH_SYMBOLS[char] + ' ';
    } else {
      res += char;
    }
  }
  return res.replace(/\s+/g, ' ').trim();
}

/**
 * Recursively converts an OMML DOM Node into LaTeX syntax.
 */
export function ommlNodeToLatex(node: any): string {
  if (!node) return '';

  if (node.nodeType === 3) {
    // Text node
    return normalizeMathText(node.nodeValue || '');
  }

  if (node.nodeType !== 1) {
    return '';
  }

  const nodeName = node.localName || node.nodeName;

  switch (nodeName) {
    case 'oMath':
    case 'oMathPara':
    case 'e': {
      let result = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          result += ommlNodeToLatex(node.childNodes[i]);
        }
      }
      return result;
    }

    case 'r': {
      let text = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          const childName = child.localName || child.nodeName;
          if (childName === 't') {
            text += child.textContent || '';
          }
        }
      }
      return normalizeMathText(text);
    }

    case 't':
      return normalizeMathText(node.textContent || '');

    // Fractions: \frac{num}{den}
    case 'f': {
      let num = '';
      let den = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          const childName = child.localName || child.nodeName;
          if (childName === 'num') {
            num = ommlNodeToLatex(child).trim();
          } else if (childName === 'den') {
            den = ommlNodeToLatex(child).trim();
          }
        }
      }
      return `\\frac{${num}}{${den}}`;
    }

    // Radicals: \sqrt{base} or \sqrt[deg]{base}
    case 'rad': {
      let deg = '';
      let base = '';
      let hasDeg = false;
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          const childName = child.localName || child.nodeName;
          if (childName === 'deg') {
            const d = ommlNodeToLatex(child).trim();
            if (d) {
              deg = d;
              hasDeg = true;
            }
          } else if (childName === 'e') {
            base = ommlNodeToLatex(child).trim();
          }
        }
      }
      return hasDeg ? `\\sqrt[${deg}]{${base}}` : `\\sqrt{${base}}`;
    }

    // Superscripts: {base}^{sup}
    case 'sSup': {
      let base = '';
      let sup = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          const childName = child.localName || child.nodeName;
          if (childName === 'e') base = ommlNodeToLatex(child).trim();
          else if (childName === 'sup') sup = ommlNodeToLatex(child).trim();
        }
      }
      return `{${base}}^{${sup}}`;
    }

    // Subscripts: {base}_{sub}
    case 'sSub': {
      let base = '';
      let sub = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          const childName = child.localName || child.nodeName;
          if (childName === 'e') base = ommlNodeToLatex(child).trim();
          else if (childName === 'sub') sub = ommlNodeToLatex(child).trim();
        }
      }
      return `{${base}}_{${sub}}`;
    }

    // Subscript & Superscript combined: {base}_{sub}^{sup}
    case 'sSubSup': {
      let base = '';
      let sub = '';
      let sup = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          const childName = child.localName || child.nodeName;
          if (childName === 'e') base = ommlNodeToLatex(child).trim();
          else if (childName === 'sub') sub = ommlNodeToLatex(child).trim();
          else if (childName === 'sup') sup = ommlNodeToLatex(child).trim();
        }
      }
      return `{${base}}_{${sub}}^{${sup}}`;
    }

    // Delimiters / Parentheses
    case 'd': {
      let begChr = '(';
      let endChr = ')';
      let content = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          const childName = child.localName || child.nodeName;
          if (childName === 'dPr') {
            for (let j = 0; j < child.childNodes.length; j++) {
              const prop = child.childNodes[j];
              const propName = prop.localName || prop.nodeName;
              if (propName === 'begChr') begChr = prop.getAttribute('m:val') || '(';
              if (propName === 'endChr') endChr = prop.getAttribute('m:val') || ')';
            }
          } else if (childName === 'e') {
            content += ommlNodeToLatex(child);
          }
        }
      }
      const left = begChr === '{' ? '\\left\\{' : `\\left${begChr}`;
      const right = endChr === '}' ? '\\right\\}' : `\\right${endChr}`;
      return `${left}${content}${right}`;
    }

    // Functions: \sin, \cos, \tan, \ln, \log...
    case 'func': {
      let fName = '';
      let body = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          const childName = child.localName || child.nodeName;
          if (childName === 'fName') fName = ommlNodeToLatex(child).trim();
          else if (childName === 'e') body = ommlNodeToLatex(child).trim();
        }
      }
      return `${fName} ${body}`;
    }

    // Integrals, Sums, Products
    case 'nary': {
      let op = '\\int';
      let sub = '';
      let sup = '';
      let body = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          const childName = child.localName || child.nodeName;
          if (childName === 'naryPr') {
            for (let j = 0; j < child.childNodes.length; j++) {
              const p = child.childNodes[j];
              const pName = p.localName || p.nodeName;
              if (pName === 'chr') {
                const val = p.getAttribute('m:val');
                if (val === '∑') op = '\\sum';
                else if (val === '∏') op = '\\prod';
              }
            }
          } else if (childName === 'sub') sub = ommlNodeToLatex(child).trim();
          else if (childName === 'sup') sup = ommlNodeToLatex(child).trim();
          else if (childName === 'e') body = ommlNodeToLatex(child).trim();
        }
      }
      const bounds = (sub ? `_{${sub}}` : '') + (sup ? `^{${sup}}` : '');
      return `${op}${bounds} ${body}`;
    }

    // Accents / Vectors: \vec{v}, \bar{x}
    case 'acc': {
      let accChr = '→';
      let body = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          const childName = child.localName || child.nodeName;
          if (childName === 'accPr') {
            for (let j = 0; j < child.childNodes.length; j++) {
              const p = child.childNodes[j];
              if ((p.localName || p.nodeName) === 'chr') {
                accChr = p.getAttribute('m:val') || '→';
              }
            }
          } else if (childName === 'e') {
            body = ommlNodeToLatex(child).trim();
          }
        }
      }
      if (accChr === '→') return `\\vec{${body}}`;
      if (accChr === '¯') return `\\bar{${body}}`;
      if (accChr === '^') return `\\hat{${body}}`;
      return `\\vec{${body}}`;
    }

    default: {
      let result = '';
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          result += ommlNodeToLatex(node.childNodes[i]);
        }
      }
      return result;
    }
  }
}

/**
 * Transforms word/document.xml content by replacing all <m:oMath> and <m:oMathPara>
 * tags with standard Word text runs containing LaTeX ($...$).
 */
export function preprocessWordXmlOmml(xmlContent: string): string {
  if (!xmlContent || (!xmlContent.includes('m:oMath') && !xmlContent.includes('oMath'))) {
    return xmlContent;
  }

  try {
    const doc = new DOMParser().parseFromString(xmlContent, 'text/xml');

    // Process top-level oMathPara (display math)
    const mathParas = doc.getElementsByTagName('m:oMathPara');
    for (let i = mathParas.length - 1; i >= 0; i--) {
      const paraNode = mathParas[i];
      const latex = ommlNodeToLatex(paraNode).trim();
      if (latex) {
        // Replace with Word run: <w:r><w:t xml:space="preserve"> $$latex$$ </w:t></w:r>
        const runNode = doc.createElement('w:r');
        const textNode = doc.createElement('w:t');
        textNode.setAttribute('xml:space', 'preserve');
        textNode.textContent = ` $$${latex}$$ `;
        runNode.appendChild(textNode);
        paraNode.parentNode?.replaceChild(runNode, paraNode);
      }
    }

    // Process remaining inline oMath
    const mathNodes = doc.getElementsByTagName('m:oMath');
    for (let i = mathNodes.length - 1; i >= 0; i--) {
      const mathNode = mathNodes[i];
      const latex = ommlNodeToLatex(mathNode).trim();
      if (latex) {
        // Replace with Word run: <w:r><w:t xml:space="preserve"> $latex$ </w:t></w:r>
        const runNode = doc.createElement('w:r');
        const textNode = doc.createElement('w:t');
        textNode.setAttribute('xml:space', 'preserve');
        textNode.textContent = ` $${latex}$ `;
        runNode.appendChild(textNode);
        mathNode.parentNode?.replaceChild(runNode, mathNode);
      }
    }

    return doc.toString();
  } catch (err) {
    console.warn('Could not preprocess OMML in Word XML:', err);
    return xmlContent;
  }
}
