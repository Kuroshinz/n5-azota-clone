declare module 'mammoth' {
  export interface ImageElement {
    contentType: string;
    read(encoding?: string): Promise<string | Buffer>;
  }

  export interface ImageConverterOptions {
    src?: string;
  }

  export const images: {
    inlineImage(
      converter: (element: ImageElement) => Promise<ImageConverterOptions> | ImageConverterOptions
    ): any;
  };

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer } | { path: string },
    options?: any
  ): Promise<{ value: string; messages: any[] }>;

  export function extractRawText(
    input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer } | { path: string }
  ): Promise<{ value: string; messages: any[] }>;
}
