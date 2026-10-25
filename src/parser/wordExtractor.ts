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
async function preprocessDocxMath(buffer: ArrayBuffer | Buffer): Promise<ArrayBuffer | Buffer> {
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
 * from a Microsoft Word (.docx) buffer.
 */
export async function extractTextAndImagesFromDocx(
  buffer: ArrayBuffer | Buffer
): Promise<ExtractedDocxResult> {
  let imageCount = 0;

  try {
    // Step 1: Preprocess OMML equations to LaTeX text
    const processedBuffer = await preprocessDocxMath(buffer);

    // Step 2: Configure Mammoth image conversion with WMF/EMF -> SVG support
    const imageHandler = async (element: any) => {
      imageCount++;
      const bufferData = await element.read();
      const contentType = (element.contentType || '').toLowerCase();

      // Check if the image is a Windows Metafile (MathType equation or vector diagram)
      const isWmf =
        contentType.includes('wmf') ||
        contentType.includes('emf') ||
        (element.altText && element.altText.toLowerCase().includes('mathtype'));

      if (isWmf) {
        try {
          const wmfResult = convertWmfToSvg(bufferData);
          return {
            src: wmfResult.dataUrl,
          };
        } catch (wmfErr) {
          console.warn('WMF to SVG conversion failed, falling back to base64 data URL', wmfErr);
        }
      }

      // Standard web image format (PNG, JPEG, GIF, SVG)
      const base64 =
        typeof Buffer !== 'undefined'
          ? Buffer.from(bufferData).toString('base64')
          : btoa(
              new Uint8Array(bufferData).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ''
              )
            );

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

    const inputData: any =
      typeof Buffer !== 'undefined'
        ? { buffer: Buffer.isBuffer(processedBuffer) ? processedBuffer : Buffer.from(processedBuffer as ArrayBuffer) }
        : { arrayBuffer: processedBuffer };

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
