import mammoth from 'mammoth';

export interface WordExtractionResult {
  rawText: string;
  imageCount: number;
}

export function convertDocxHtmlToExamText(html: string): { text: string; imageCount: number } {
  let imageCount = 0;

  // Replace images with markdown format: ![Hình vẽ](data:image/...)
  let processed = html.replace(/<img\s+[^>]*src="([^"]+)"[^>]*>/gi, (_match, src) => {
    imageCount++;
    return `\n\n![Hình vẽ](${src})\n\n`;
  });

  // Table handling: separate cells within row with space, rows with newline
  processed = processed.replace(/<\/td>\s*<td[^>]*>/gi, ' ');
  processed = processed.replace(/<\/tr>\s*<tr[^>]*>/gi, '\n');
  processed = processed.replace(/<\/?(table|tbody|thead|tr|td|th)[^>]*>/gi, '\n');

  // Paragraph & break handling
  processed = processed.replace(/<p[^>]*>/gi, '\n');
  processed = processed.replace(/<\/p>/gi, '\n');
  processed = processed.replace(/<br\s*\/?>/gi, '\n');

  // Strip other HTML tags
  processed = processed.replace(/<[^>]+>/g, '');

  // Decode non-breaking spaces and clean whitespace
  processed = processed.replace(/&nbsp;/g, ' ');
  processed = processed.replace(/\u00A0/g, ' ');

  // Convert tab alignment to newline so inline options A, B, C, D become cleanly separated lines
  processed = processed.replace(/\t+/g, '\n');

  // Clean consecutive spaces
  processed = processed.replace(/[^\S\r\n]+/g, ' ');
  processed = processed.replace(/\n\s+\n/g, '\n\n');
  processed = processed.replace(/\n{3,}/g, '\n\n');

  return {
    text: processed.trim(),
    imageCount,
  };
}

export async function extractTextAndImagesFromDocx(buffer: ArrayBuffer | Buffer): Promise<WordExtractionResult> {
  const imageHandler = (element: any) => {
    return element.read('base64').then((imageBuffer: string) => {
      return {
        src: `data:${element.contentType};base64,${imageBuffer}`,
      };
    });
  };

  // Safe converter supporting all versions of mammoth
  const convertImage =
    mammoth.images && typeof mammoth.images.imgElement === 'function'
      ? mammoth.images.imgElement(imageHandler)
      : mammoth.images && typeof (mammoth.images as any).inline === 'function'
      ? (mammoth.images as any).inline(imageHandler)
      : undefined;

  const options = convertImage ? { convertImage } : {};

  // Support both browser ArrayBuffer and Node Buffer under 'buffer' and 'arrayBuffer'
  const input = {
    buffer: buffer as any,
    arrayBuffer: buffer as any,
  };

  const { value: html } = await mammoth.convertToHtml(input, options);
  const { text, imageCount } = convertDocxHtmlToExamText(html);

  return {
    rawText: text,
    imageCount,
  };
}
