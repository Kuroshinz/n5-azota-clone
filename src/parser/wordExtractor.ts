import * as mammoth from 'mammoth';
import JSZip from 'jszip';
import { preprocessWordXmlOmml } from './ommlConverter';
import { convertWmfToSvg } from './wmfConverter';
import { normalizeMathFormulas } from './mathConverter';

export interface ExtractedDocxResult {
  rawText: string;
  imageCount: number;
}

/**
 * Normalizes tab and multi-space separated inline options (e.g., "A. 1 \t B. 2 \t C. 3 \t D. 4")
 * into distinct newlines so that standard line-based question parsers can reliably match them.
 */
export function normalizeInlineChoices(text: string): string {
  if (!text) return '';

  return text
    .split(/\r?\n/)
    .map((line) => {
      // If the line is part of a markdown table, do not split it
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        return line;
      }

      // Only split inline options if the line contains at least 2 distinct option markers
      const optionCount = (line.match(/(?:^|\t+|\s{2,})(\*?[A-D][.:\)]|\*?\[[A-D]\]|\*?\([A-D]\))(?=\s+)/g) || []).length;
      if (optionCount < 2) {
        return line;
      }

      // Split on tabs or 2+ spaces if followed by an option indicator like B., C., D. or *B., *C.
      return line
        .replace(/(?:\t+|\s{2,})(\*?[A-D][.:\)])(?=\s+)/g, '\n$1')
        .replace(/(?:\t+|\s{2,})(\*?[a-d][.:\)])(?=\s+)/g, '\n$1');
    })
    .join('\n');
}

/**
 * Converts HTML tables (exported by Mammoth from Word .docx) into well-structured Markdown tables.
 * This preserves rows and columns rather than flattening them into one vertical list.
 */
export function convertHtmlTablesToMarkdown(html: string): string {
  if (!html.includes('<table')) return html;

  return html.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_match, tableContent) => {
    const rowMatches = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    if (!rowMatches || rowMatches.length === 0) return '';

    const rows: string[][] = [];

    for (const tr of rowMatches) {
      const cellMatches = tr.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi);
      if (!cellMatches) continue;

      const cells = cellMatches.map((cell: string) => {
        // Strip outer <td...> and </td>
        let inner = cell.replace(/^<(?:td|th)[^>]*>/i, '').replace(/<\/(?:td|th)>$/i, '');
        // Replace <br> or </p> inside cell with a space
        inner = inner.replace(/<br\s*\/?>/gi, ' ').replace(/<\/p>/gi, ' ');
        // Strip other HTML tags except placeholder tokens
        inner = inner.replace(/<(?!\/?__IMG_)[^>]+>/g, '');
        // Clean whitespace and escape pipes
        inner = inner.replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|');
        return inner;
      });

      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    if (rows.length === 0) return '';

    const maxCols = Math.max(...rows.map((r) => r.length));
    if (maxCols === 0) return '';

    const paddedRows = rows.map((r) => {
      const row = [...r];
      while (row.length < maxCols) row.push('');
      return row;
    });

    const mdLines: string[] = [];
    // Header row
    mdLines.push(`| ${paddedRows[0].join(' | ')} |`);
    // Alignment / separator row
    mdLines.push(`| ${Array(maxCols).fill(':---').join(' | ')} |`);

    // Data rows
    for (let i = 1; i < paddedRows.length; i++) {
      mdLines.push(`| ${paddedRows[i].join(' | ')} |`);
    }

    return `\n\n${mdLines.join('\n')}\n\n`;
  });
}

/**
 * Converts HTML exported from Mammoth into structured exam text suitable for parseExamText.
 * Handles subscripts, superscripts, tables, and prevents inline images from breaking option lines.
 */
export function convertDocxHtmlToExamText(html: string): { text: string; imageCount: number } {
  let imageCount = 0;
  const imagePlaceholders: string[] = [];

  // 1. Convert Word subscripts and superscripts into math exponents
  let converted = html
    .replace(/<sup>(.*?)<\/sup>/gi, '^{$1}')
    .replace(/<sub>(.*?)<\/sub>/gi, '_{$1}');

  // 2. Replace standalone paragraph images <p><img ...></p> with block markdown image placeholder
  converted = converted.replace(/<p>\s*<img[^>]+src=["']([^"']+)["'][^>]*>\s*<\/p>/gi, (_match, src) => {
    const idx = imagePlaceholders.length;
    imagePlaceholders.push(`\n![Hình vẽ](${src})\n`);
    imageCount++;
    return ` __IMG_BLOCK_${idx}__ `;
  });

  // 3. Replace inline <img> without adding destructive newlines
  converted = converted.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (_match, src) => {
    const idx = imagePlaceholders.length;
    imagePlaceholders.push(` ![Hình vẽ](${src}) `);
    imageCount++;
    return ` __IMG_INLINE_${idx}__ `;
  });

  // 4. Convert HTML tables to Markdown tables BEFORE stripping paragraphs/tags
  converted = convertHtmlTablesToMarkdown(converted);

  // 5. Replace paragraphs and line breaks outside tables
  converted = converted.replace(/<\/p>/gi, '\n');
  converted = converted.replace(/<br\s*\/?>/gi, '\n');
  converted = converted.replace(/<\/li>/gi, '\n');
  converted = converted.replace(/<\/tr>/gi, '\n');
  converted = converted.replace(/<\/td>/gi, ' ');

  // 6. Strip remaining HTML tags safely without affecting image URLs
  let plainText = converted.replace(/<[^>]+>/g, '');

  // 7. Restore image placeholders
  imagePlaceholders.forEach((imgMarkdown, idx) => {
    plainText = plainText
      .replace(new RegExp(`__IMG_BLOCK_${idx}__`, 'g'), imgMarkdown)
      .replace(new RegExp(`__IMG_INLINE_${idx}__`, 'g'), imgMarkdown);
  });

  // 8. Decode common HTML entities
  plainText = plainText
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 9. Normalize inline choices split by tabs or spaces
  plainText = normalizeInlineChoices(plainText);

  // 10. Run universal math and science formula normalizer
  plainText = normalizeMathFormulas(plainText);

  return {
    text: plainText,
    imageCount,
  };
}

/**
 * Preprocesses a Word (.docx) buffer by converting Office Math (OMML) to LaTeX text runs
 * so that Mammoth produces clean mathematical formulas ($...$).
 */
async function preprocessDocxMath(
  buffer: ArrayBuffer | Buffer | Uint8Array
): Promise<ArrayBuffer | Buffer | Uint8Array> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXmlFile = zip.file('word/document.xml');

    if (docXmlFile) {
      const docXmlContent = await docXmlFile.async('string');
      if (docXmlContent.includes('oMath')) {
        const modifiedXml = preprocessWordXmlOmml(docXmlContent);
        zip.file('word/document.xml', modifiedXml);

        // Re-generate updated docx
        if (typeof Buffer !== 'undefined' && Buffer.isBuffer(buffer)) {
          return await zip.generateAsync({ type: 'nodebuffer' });
        } else {
          return await zip.generateAsync({ type: 'arraybuffer' });
        }
      }
    }
  } catch (err) {
    console.warn('OMML preprocessing skipped due to error:', err);
  }

  return buffer;
}

/**
 * Extracts raw text and converts embedded images (including WMF/EMF equations to SVG)
 * from a Microsoft Word (.docx) buffer, ArrayBuffer, or Uint8Array.
 * Works seamlessly across both Node.js and Browser environments.
 */
export async function extractTextAndImagesFromDocx(
  buffer: ArrayBuffer | Buffer | Uint8Array
): Promise<ExtractedDocxResult> {
  let imageCount = 0;

  try {
    // Step 1: Preprocess OMML equations to LaTeX text
    const processed = await preprocessDocxMath(buffer);

    // Step 2: Extract reliable ArrayBuffer and Node Buffer representations
    let arrayBufferData: ArrayBuffer;
    if (processed instanceof ArrayBuffer) {
      arrayBufferData = processed;
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(processed)) {
      arrayBufferData = processed.buffer.slice(
        processed.byteOffset,
        processed.byteOffset + processed.byteLength
      ) as ArrayBuffer;
    } else if (processed instanceof Uint8Array || (processed && (processed as any).buffer instanceof ArrayBuffer)) {
      const view = processed as Uint8Array;
      arrayBufferData = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
    } else {
      const u8 = new Uint8Array(processed as any);
      arrayBufferData = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
    }

    let nodeBufferData: any = undefined;
    if (typeof Buffer !== 'undefined') {
      nodeBufferData = Buffer.isBuffer(processed)
        ? processed
        : Buffer.from(arrayBufferData);
    }

    // Step 3: Configure Mammoth image conversion with WMF/EMF -> SVG support
    const imageHandler = async (element: any) => {
      imageCount++;
      const contentType = (element.contentType || '').toLowerCase();

      // Check if the image is a Windows Metafile (MathType equation or vector diagram)
      const isWmf =
        contentType.includes('wmf') ||
        contentType.includes('emf') ||
        (element.altText && element.altText.toLowerCase().includes('mathtype'));

      if (isWmf) {
        try {
          const bufferData = await element.read();
          const wmfResult = convertWmfToSvg(bufferData);
          return {
            src: wmfResult.dataUrl,
          };
        } catch (wmfErr) {
          console.warn('WMF to SVG conversion failed, falling back to base64 data URL', wmfErr);
        }
      }

      // Standard web image format (PNG, JPEG, GIF, SVG)
      let base64 = '';
      if (typeof element.readAsBase64String === 'function') {
        base64 = await element.readAsBase64String();
      } else {
        const bufferData = await element.read();
        if (typeof Buffer !== 'undefined') {
          base64 = Buffer.from(bufferData).toString('base64');
        } else {
          const u8 = new Uint8Array(bufferData);
          let binary = '';
          for (let i = 0; i < u8.length; i++) {
            binary += String.fromCharCode(u8[i]);
          }
          base64 = btoa(binary);
        }
      }

      const mimeType = contentType || 'image/png';
      return {
        src: `data:${mimeType};base64,${base64}`,
      };
    };

    const mammothImages = mammoth.images as any;
    const convertImage =
      mammothImages && typeof mammothImages.imgElement === 'function'
        ? mammothImages.imgElement(imageHandler)
        : mammothImages && typeof mammothImages.inline === 'function'
        ? mammothImages.inline(imageHandler)
        : mammothImages && typeof mammothImages.inlineImage === 'function'
        ? mammothImages.inlineImage(imageHandler)
        : undefined;

    const mammothOptions: any = {};
    if (convertImage) {
      mammothOptions.convertImage = convertImage;
    }

    // Pass BOTH arrayBuffer and buffer so Mammoth works in both Node.js (lib/unzip.js)
    // and Browser (browser/unzip.js) environments without "Could not find file in options" error!
    const inputData: any = {
      arrayBuffer: arrayBufferData,
      ...(nodeBufferData ? { buffer: nodeBufferData } : {}),
    };

    const result = await mammoth.convertToHtml(inputData, mammothOptions);
    const converted = convertDocxHtmlToExamText(result.value);

    return {
      rawText: converted.text,
      imageCount: Math.max(imageCount, converted.imageCount),
    };
  } catch (error: any) {
    console.error('Word extraction error:', error);
    throw new Error(`Không thể giải nén file Word (.docx): ${error?.message || 'Lỗi không xác định'}`);
  }
}
