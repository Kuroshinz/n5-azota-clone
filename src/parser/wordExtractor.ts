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

  // Table handling
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
  processed = processed.replace(/[ \t]+/g, ' ');
  processed = processed.replace(/\n\s+\n/g, '\n\n');
  processed = processed.replace(/\n{3,}/g, '\n\n');

  return {
    text: processed.trim(),
    imageCount,
  };
}

export async function extractTextAndImagesFromDocx(buffer: ArrayBuffer): Promise<WordExtractionResult> {
  const options = {
    convertImage: mammoth.images.inlineImage(element => {
      return element.read('base64').then(imageBuffer => {
        return {
          src: `data:${element.contentType};base64,${imageBuffer}`,
        };
      });
    }),
  };

  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buffer }, options);
  const { text, imageCount } = convertDocxHtmlToExamText(html);

  return {
    rawText: text,
    imageCount,
  };
}
