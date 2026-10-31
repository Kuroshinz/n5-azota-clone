import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { convertDocxHtmlToExamText, extractTextAndImagesFromDocx } from '../src/parser/wordExtractor';
import { preprocessWordXmlOmml } from '../src/parser/ommlConverter';
import { convertWmfToSvg } from '../src/parser/wmfConverter';
import { normalizeMathFormulas } from '../src/parser/mathConverter';

describe('wordExtractor: convertDocxHtmlToExamText', () => {
  it('converts basic paragraphs and breaks into formatted exam text', () => {
    const html = '<p>Câu 1. Phương trình bậc hai $x^2 - 4 = 0$ có nghiệm là:</p><p>A. $x = 2$</p><p>B. $x = \\pm 2$</p>';
    const result = convertDocxHtmlToExamText(html);
    expect(result.text).toContain('Câu 1. Phương trình bậc hai $x^2 - 4 = 0$ có nghiệm là:');
    expect(result.text).toContain('A. $x = 2$');
    expect(result.text).toContain('B. $x = \\pm 2$');
    expect(result.imageCount).toBe(0);
  });

  it('keeps inline images inside options on the same line without breaking option syntax', () => {
    const html = '<p>A. T = 2\\pi<img src="data:image/svg+xml;utf8,<svg></svg>" /></p><p>B. T = <img src="data:image/svg+xml;utf8,<svg></svg>" /></p>';
    const result = convertDocxHtmlToExamText(html);
    expect(result.text).toContain('![Hình vẽ](data:image/svg+xml;utf8,<svg></svg>)');
    // Ensure option A contains both the formula prefix and the image on one line
    const lines = result.text.split('\n');
    const lineA = lines.find((l) => l.startsWith('A.'));
    expect(lineA).toBeDefined();
    expect(lineA).toContain('2\\pi');
    expect(lineA).toContain('![Hình vẽ]');
    expect(result.imageCount).toBe(2);
  });

  it('converts Word subscripts and superscripts into valid KaTeX exponents', () => {
    const html = '<p>Câu 1. Vận tốc ban đầu v<sub>0</sub> = 10 m/s, gia tốc a = 2 m/s<sup>2</sup>. Quãng đường s = x<sup>2</sup> + 4.</p>';
    const result = convertDocxHtmlToExamText(html);
    expect(result.text).toContain('v_{0}');
    expect(result.text).toContain('x^{2}');
  });

  it('converts Word HTML tables into structured Markdown tables', () => {
    const html = `
      <p>Câu 3. Số liệu thực nghiệm:</p>
      <table>
        <tr>
          <td><p>Nhiệt độ (°C)</p></td>
          <td><p>[H<sub>2</sub>] (mol/L)</p></td>
          <td><p>Kc</p></td>
        </tr>
        <tr>
          <td><p>25</p></td>
          <td><p>0,0355</p></td>
          <td><p>50</p></td>
        </tr>
        <tr>
          <td><p>340</p></td>
          <td><p>0,0380</p></td>
          <td><p>9,6</p></td>
        </tr>
      </table>
      <p>A. 25 độ C</p>
      <p>B. 340 độ C</p>
    `;
    const result = convertDocxHtmlToExamText(html);
    expect(result.text).toContain('| Nhiệt độ (°C) | [$\\mathrm{H_2}$] (mol/L) | Kc |');
    expect(result.text).toContain('| :--- | :--- | :--- |');
    expect(result.text).toContain('| 25 | 0,0355 | 50 |');
    expect(result.text).toContain('| 340 | 0,0380 | 9,6 |');
    expect(result.text).toContain('A. 25 độ C');
    expect(result.text).toContain('B. 340 độ C');
  });
});

describe('wordExtractor: extractTextAndImagesFromDocx', () => {
  it('extracts from ArrayBuffer (browser format) and Buffer (Node format) without "Could not find file in options" error', async () => {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Câu 1: Thử nghiệm bóc tách Word</w:t></w:r></w:p><w:p><w:r><w:t>A. Đúng</w:t></w:r></w:p></w:body></w:document>');

    const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const nodeBuffer = Buffer.from(arrayBuffer);
    const uint8Array = new Uint8Array(arrayBuffer);

    // 1. ArrayBuffer (how browser sends it from file.arrayBuffer())
    const resArr = await extractTextAndImagesFromDocx(arrayBuffer);
    expect(resArr.rawText).toContain('Câu 1: Thử nghiệm bóc tách Word');
    expect(resArr.rawText).toContain('A. Đúng');

    // 2. Buffer (how Node/server sends it)
    const resBuf = await extractTextAndImagesFromDocx(nodeBuffer);
    expect(resBuf.rawText).toContain('Câu 1: Thử nghiệm bóc tách Word');

    // 3. Uint8Array
    const resU8 = await extractTextAndImagesFromDocx(uint8Array);
    expect(resU8.rawText).toContain('Câu 1: Thử nghiệm bóc tách Word');
  });
});

describe('ommlConverter: preprocessWordXmlOmml', () => {
  it('converts Word OMML physics equations into LaTeX', () => {
    const xml = `
      <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
        <w:r><w:t>Chu kì: </w:t></w:r>
        <m:oMath>
          <m:r><m:t>T = 2</m:t></m:r>
          <m:r><m:t>π</m:t></m:r>
          <m:rad>
            <m:radPr><m:degHide m:val="1"/></m:radPr>
            <m:deg/>
            <m:e>
              <m:f>
                <m:num><m:r><m:t>m</m:t></m:r></m:num>
                <m:den><m:r><m:t>k</m:t></m:r></m:den>
              </m:f>
            </m:e>
          </m:rad>
        </m:oMath>
      </w:p>
    `;
    const preprocessed = preprocessWordXmlOmml(xml);
    expect(preprocessed).toContain('$T = 2\\pi\\sqrt{\\frac{m}{k}}$');
  });
});

describe('wmfConverter: convertWmfToSvg', () => {
  it('parses WMF binary buffer and outputs clean valid SVG data URL', () => {
    // Construct a minimal valid 18-byte WMF binary structure with Placeable header
    const buffer = Buffer.alloc(40);
    // Aldus Magic: 0x9AC6CDD7
    buffer.writeUInt32LE(0x9AC6CDD7, 0);
    buffer.writeInt16LE(0, 6);   // left
    buffer.writeInt16LE(0, 8);   // top
    buffer.writeInt16LE(100, 10); // right
    buffer.writeInt16LE(50, 12);  // bottom

    // Standard WMF header at offset 22
    buffer.writeUInt16LE(1, 22);  // mtType = memory
    buffer.writeUInt16LE(9, 24);  // mtHeaderSize
    buffer.writeUInt16LE(0x0300, 26); // mtVersion

    const result = convertWmfToSvg(buffer);
    expect(result.dataUrl).toContain('data:image/svg+xml;utf8,');
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('viewBox="0 0 100 50"');
  });
});

describe('mathConverter: normalizeMathFormulas', () => {
  it('converts Vietnamese physics shorthand into KaTeX formulas', () => {
    const raw = 'Câu 16: Chu kì dao động con lắc lò xo là T = 2pi*căn(m/k).';
    const normalized = normalizeMathFormulas(raw);
    expect(normalized).toContain('\\sqrt{\\frac{m}{k}}');
    expect(normalized).toContain('2\\pi');
  });

  it('standardizes physics units and powers of 10', () => {
    const raw = 'Vận tốc c = 3.10^8 m/s, gia tốc a = 9.8 m/s^2, góc quay omega = 10 rad/s.';
    const normalized = normalizeMathFormulas(raw);
    expect(normalized).toContain('10^{8}');
    expect(normalized).toContain('\\text{m/s}^2');
    expect(normalized).toContain('\\text{rad/s}');
  });

  it('formats chemistry formulas with subscripts', () => {
    const raw = 'Cho Fe3O4 tác dụng với H2SO4 đặc nóng tạo ra SO2 và H2O.';
    const normalized = normalizeMathFormulas(raw);
    expect(normalized).toContain('Fe_3O_4');
    expect(normalized).toContain('H_2SO_4');
    expect(normalized).toContain('SO_2');
    expect(normalized).toContain('H_2O');
  });
});
