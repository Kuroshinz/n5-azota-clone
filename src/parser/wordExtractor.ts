import * as mammoth from 'mammoth';

export interface ExtractedDocxResult {
  rawText: string;
  imageCount: number;
}

/**
 * Normalizes tab and multi-space separated inline options (e.g., "A. 1 \t B. 2 \t C. 3 \t D. 4")
 * into distinct newlines so that standard line-based question parsers can reliably match them.
 */
export function normalizeInlineChoices(text: string): string {
  // If a line contains multiple options separated by tabs or multiple spaces
  return text
    .split(/\r?\n/)
    .map((line) => {
      // Split on tabs or 3+ spaces if followed by an option indicator like B., C., D. or b), c), d)
      return line
        .replace(/\t+([A-D]\.|\([A-D]\)|[a-d]\)|\([a-d]\))/g, '\n$1')
        .replace(/ {3,}([A-D]\.|\([A-D]\)|[a-d]\)|\([a-d]\))/g, '\n$1');
    })
    .join('\n');
}

/**
 * Converts HTML exported from Mammoth into structured exam text suitable for parseExamText.
 */
export function convertDocxHtmlToExamText(html: string): { text: string; imageCount: number } {
  let imageCount = 0;

  // 1. Replace <img> with Markdown image syntax ![Hình vẽ](data:...)
  let converted = html.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (_match, src) => {
    imageCount++;
    return `\n![Hình vẽ](${src})\n`;
  });

  // 2. Replace paragraphs and line breaks
  converted = converted.replace(/<\/p>/gi, '\n');
  converted = converted.replace(/<br\s*\/?>/gi, '\n');
  converted = converted.replace(/<\/li>/gi, '\n');
  converted = converted.replace(/<\/tr>/gi, '\n');
  converted = converted.replace(/<\/td>/gi, ' ');

  // 3. Strip remaining HTML tags
  let plainText = converted.replace(/<[^>]+>/g, '');

  // 4. Decode common HTML entities
  plainText = plainText
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 5. Normalize inline choices split by tabs or spaces
  plainText = normalizeInlineChoices(plainText);

  return {
    text: plainText,
    imageCount,
  };
}

/**
 * Extracts raw text and converts embedded images into base64 Data URIs
 * from a Microsoft Word (.docx) buffer.
 */
export async function extractTextAndImagesFromDocx(
  buffer: ArrayBuffer | Buffer
): Promise<ExtractedDocxResult> {
  let imageCount = 0;

  try {
    const imageHandler = async (element: any) => {
      imageCount++;
      const bufferData = await element.read();
      const contentType = element.contentType || 'image/png';
      const base64 =
        typeof Buffer !== 'undefined'
          ? Buffer.from(bufferData).toString('base64')
          : btoa(
              new Uint8Array(bufferData).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ''
              )
            );
      return {
        src: `data:${contentType};base64,${base64}`,
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

    // Convert Word document to HTML with embedded images
    // Mammoth expects buffer in options
    const htmlResult = await mammoth.convertToHtml(
      { buffer: buffer as any, arrayBuffer: buffer as any },
      convertImage ? { convertImage } : undefined
    );

    const converted = convertDocxHtmlToExamText(htmlResult.value);

    return {
      rawText: converted.text,
      imageCount: imageCount > 0 ? imageCount : converted.imageCount,
    };
  } catch (err: any) {
    console.error('Lỗi khi phân tích tệp .docx:', err);
    throw new Error(`Không thể giải nén tài liệu Word: ${err.message}`);
  }
}
