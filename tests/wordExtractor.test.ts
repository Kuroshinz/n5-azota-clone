import { describe, it, expect } from 'vitest';
import { convertDocxHtmlToExamText } from '../src/parser/wordExtractor';

describe('wordExtractor: convertDocxHtmlToExamText', () => {
  it('converts basic paragraphs and breaks into formatted exam text', () => {
    const html = '<p>Câu 1. Phương trình bậc hai $x^2 - 4 = 0$ có nghiệm là:</p><p>A. $x = 2$</p><p>B. $x = \\pm 2$</p>';
    const result = convertDocxHtmlToExamText(html);
    expect(result.text).toContain('Câu 1. Phương trình bậc hai $x^2 - 4 = 0$ có nghiệm là:');
    expect(result.text).toContain('A. $x = 2$');
    expect(result.text).toContain('B. $x = \\pm 2$');
    expect(result.imageCount).toBe(0);
  });

  it('converts <img> tags into markdown image format and counts images', () => {
    const html = '<p>Câu 2. Cho đồ thị hàm số như hình vẽ sau:</p><p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==" /></p><p>A. Hàm số đồng biến</p>';
    const result = convertDocxHtmlToExamText(html);
    expect(result.text).toContain('![Hình vẽ](data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==)');
    expect(result.imageCount).toBe(1);
  });

  it('handles tables and cleans non-breaking spaces', () => {
    const html = '<p>Bảng&nbsp;đáp&nbsp;án:</p><table><tr><td>1</td><td>A</td></tr><tr><td>2</td><td>B</td></tr></table>';
    const result = convertDocxHtmlToExamText(html);
    expect(result.text).toContain('Bảng đáp án:');
    expect(result.text).toContain('1 A');
    expect(result.text).toContain('2 B');
  });
});
