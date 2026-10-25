/**
 * WMF (Windows Metafile) and EMF to SVG & Formula Text Converter
 * Enables browsers (Chrome, Edge, Safari, Firefox) to render legacy Microsoft Word
 * equation images and diagrams that are embedded as image/x-wmf or image/x-emf.
 */

export interface WmfParseResult {
  svg: string;
  dataUrl: string;
  extractedText: string;
  isFormula: boolean;
}

const SYMBOL_CHAR_MAP: Record<number, string> = {
  0x70: '\\pi',      // π
  0x77: '\\omega',   // ω
  0x57: '\\Omega',   // Ω
  0x6C: '\\lambda',  // λ
  0x4C: '\\Lambda',  // Λ
  0x61: '\\alpha',   // α
  0x62: '\\beta',    // β
  0x67: '\\gamma',   // γ
  0x64: '\\delta',   // δ
  0x44: '\\Delta',   // Δ
  0x65: '\\varepsilon', // ε
  0x71: '\\theta',   // θ
  0x6D: '\\mu',      // μ
  0x72: '\\rho',     // ρ
  0x73: '\\sigma',   // σ
  0x74: '\\tau',     // τ
  0x6A: '\\varphi',  // φ
  0xB1: '\\pm',      // ±
  0xB4: '\\times',   // ×
  0xB8: '\\div',     // ÷
  0xB9: '\\ne',      // ≠
  0xA3: '\\le',      // ≤
  0xB3: '\\ge',      // ≥
  0xBB: '\\approx',  // ≈
  0xA5: '\\infty',   // ∞
  0xAE: '\\to',      // →
};

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Parses a binary WMF buffer and produces an SVG string and Data URI.
 */
export function convertWmfToSvg(buffer: Buffer | Uint8Array | ArrayBuffer): WmfParseResult {
  const bytes =
    buffer instanceof Uint8Array
      ? buffer
      : buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer)
      : new Uint8Array(buffer as any);

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  // 1. Check for Aldus Placeable Header (22 bytes, magic: 0x9AC6CDD7)
  let bbox = { left: 0, top: 0, right: 1000, bottom: 400 };

  if (bytes.length > 22 && view.getUint32(0, true) === 0x9AC6CDD7) {
    bbox.left = view.getInt16(6, true);
    bbox.top = view.getInt16(8, true);
    bbox.right = view.getInt16(10, true);
    bbox.bottom = view.getInt16(12, true);
    offset = 22;
  }

  // 2. Standard WMF Header (18 bytes)
  if (offset + 18 <= bytes.length) {
    offset += 18;
  }

  const textSnippets: string[] = [];
  const svgElements: string[] = [];
  let curX = 0;
  let curY = 0;
  let curPath = '';
  let isFormula = false;

  const strokeColor = '#1e293b';
  const fillColor = '#0f172a';

  while (offset + 6 <= bytes.length) {
    const sizeWords = view.getUint32(offset, true);
    const func = view.getUint16(offset + 4, true);
    const sizeBytes = sizeWords * 2;

    if (sizeBytes < 6 || offset + sizeBytes > bytes.length) break;
    if (func === 0x0000) break; // META_EOF

    const paramOffset = offset + 6;
    const paramLength = sizeBytes - 6;

    // 0x0626: META_ESCAPE (MathType comment / MTEF)
    if (func === 0x0626 && paramLength >= 4) {
      isFormula = true;
    }
    // 0x0521: META_TEXTOUT
    else if (func === 0x0521 && paramLength >= 6) {
      const count = view.getInt16(paramOffset, true);
      const strBytes = bytes.slice(paramOffset + 2, paramOffset + 2 + count);
      const y = view.getInt16(paramOffset + 2 + ((count + 1) & ~1), true);
      const x = view.getInt16(paramOffset + 4 + ((count + 1) & ~1), true);

      let textStr = '';
      for (let i = 0; i < strBytes.length; i++) {
        const b = strBytes[i];
        if (SYMBOL_CHAR_MAP[b]) {
          textStr += SYMBOL_CHAR_MAP[b];
          isFormula = true;
        } else {
          textStr += String.fromCharCode(b);
        }
      }

      if (textStr.trim()) {
        textSnippets.push(textStr);
        svgElements.push(
          `<text x="${x}" y="${y}" font-family="Cambria Math, KaTeX_Math, Times New Roman, serif" font-size="14" fill="${fillColor}">${escapeXml(textStr)}</text>`
        );
      }
    }
    // 0x0A32: META_EXTTEXTOUT
    else if (func === 0x0A32 && paramLength >= 8) {
      const y = view.getInt16(paramOffset, true);
      const x = view.getInt16(paramOffset + 2, true);
      const count = view.getInt16(paramOffset + 4, true);
      const options = view.getUint16(paramOffset + 6, true);
      let strOffset = paramOffset + 8;
      if (options & 6) strOffset += 8; // skip rect if clipped/opaque

      if (strOffset + count <= offset + sizeBytes) {
        const strBytes = bytes.slice(strOffset, strOffset + count);
        let textStr = '';
        for (let i = 0; i < strBytes.length; i++) {
          const b = strBytes[i];
          if (SYMBOL_CHAR_MAP[b]) {
            textStr += SYMBOL_CHAR_MAP[b];
            isFormula = true;
          } else {
            textStr += String.fromCharCode(b);
          }
        }

        if (textStr.trim()) {
          textSnippets.push(textStr);
          svgElements.push(
            `<text x="${x}" y="${y}" font-family="Cambria Math, KaTeX_Math, Times New Roman, serif" font-size="14" fill="${fillColor}">${escapeXml(textStr)}</text>`
          );
        }
      }
    }
    // 0x0214: META_MOVETO
    else if (func === 0x0214 && paramLength >= 4) {
      const y = view.getInt16(paramOffset, true);
      const x = view.getInt16(paramOffset + 2, true);
      curX = x;
      curY = y;
      curPath += ` M ${x} ${y}`;
    }
    // 0x0213: META_LINETO
    else if (func === 0x0213 && paramLength >= 4) {
      const y = view.getInt16(paramOffset, true);
      const x = view.getInt16(paramOffset + 2, true);
      curPath += ` L ${x} ${y}`;
      curX = x;
      curY = y;
    }
    // 0x0325: META_POLYLINE
    else if (func === 0x0325 && paramLength >= 2) {
      const numPoints = view.getInt16(paramOffset, true);
      let pOff = paramOffset + 2;
      let polyD = '';
      for (let p = 0; p < numPoints && pOff + 4 <= offset + sizeBytes; p++) {
        const px = view.getInt16(pOff, true);
        const py = view.getInt16(pOff + 2, true);
        pOff += 4;
        polyD += (p === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`);
      }
      if (polyD) {
        svgElements.push(`<path d="${polyD}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`);
      }
    }
    // 0x0324: META_POLYGON
    else if (func === 0x0324 && paramLength >= 2) {
      const numPoints = view.getInt16(paramOffset, true);
      let pOff = paramOffset + 2;
      const pts: string[] = [];
      for (let p = 0; p < numPoints && pOff + 4 <= offset + sizeBytes; p++) {
        const px = view.getInt16(pOff, true);
        const py = view.getInt16(pOff + 2, true);
        pOff += 4;
        pts.push(`${px},${py}`);
      }
      if (pts.length > 0) {
        svgElements.push(`<polygon points="${pts.join(' ')}" fill="none" stroke="${strokeColor}" stroke-width="1.5"/>`);
      }
    }
    // 0x041B: META_RECTANGLE
    else if (func === 0x041B && paramLength >= 8) {
      const b = view.getInt16(paramOffset, true);
      const r = view.getInt16(paramOffset + 2, true);
      const t = view.getInt16(paramOffset + 4, true);
      const l = view.getInt16(paramOffset + 6, true);
      svgElements.push(`<rect x="${Math.min(l, r)}" y="${Math.min(t, b)}" width="${Math.abs(r - l)}" height="${Math.abs(b - t)}" fill="none" stroke="${strokeColor}" stroke-width="1.5"/>`);
    }

    offset += sizeBytes;
  }

  if (curPath) {
    svgElements.push(`<path d="${curPath}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  const width = Math.max(30, Math.abs(bbox.right - bbox.left));
  const height = Math.max(20, Math.abs(bbox.bottom - bbox.top));
  const minX = Math.min(bbox.left, bbox.right);
  const minY = Math.min(bbox.top, bbox.bottom);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}" style="vertical-align: middle; display: inline-block;">
  ${svgElements.join('\n  ')}
</svg>`;

  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return {
    svg,
    dataUrl,
    extractedText: textSnippets.join(' ').trim(),
    isFormula,
  };
}
