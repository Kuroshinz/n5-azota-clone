'use client';

import React from 'react';
import katex from 'katex';
import { convertWmfToSvg } from '../parser/wmfConverter';
import { sanitizeLatexFormula, normalizeMathFormulas } from '../parser/mathConverter';

interface MathViewProps {
  content: string;
  className?: string;
}

interface TableSegment {
  type: 'table';
  headers: string[][];
  rows: string[][];
}

interface TextSegment {
  type: 'text';
  value: string;
}

type ContentSegment = TableSegment | TextSegment;

/**
 * Splits raw content into text blocks and Markdown table blocks.
 * A Markdown table has at least a header row, a delimiter row (|:---|:---|), and optional data rows.
 */
function parseMarkdownTables(content: string): ContentSegment[] {
  if (!content || !content.includes('|')) {
    return [{ type: 'text', value: content }];
  }

  // Matches consecutive lines starting and ending with pipe |
  const tableRegex = /((?:^[ \t]*\|[^\n]+\|[ \t]*(?:\r?\n|$)){2,})/gm;
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(content)) !== null) {
    const tableBlock = match[1];
    const matchStart = match.index;
    const matchEnd = matchStart + tableBlock.length;

    const lines = tableBlock
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // Check for the delimiter row (e.g. |:---|:---:|---:|)
    const sepIndex = lines.findIndex((l) => /^\|(?:\s*:?-+:?\s*\|)+$/.test(l));

    if (sepIndex !== -1 && lines.length >= 2) {
      if (matchStart > lastIndex) {
        segments.push({ type: 'text', value: content.slice(lastIndex, matchStart) });
      }

      const headerRows = lines.slice(0, sepIndex);
      const dataRows = lines.slice(sepIndex + 1);

      const parseRow = (line: string): string[] => {
        const clean = line.replace(/^\|/, '').replace(/\|$/, '');
        return clean.split('|').map((c) => c.trim().replace(/\\\|/g, '|'));
      };

      segments.push({
        type: 'table',
        headers: headerRows.map(parseRow),
        rows: dataRows.map(parseRow),
      });

      lastIndex = matchEnd;
    }
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return segments;
}

/**
 * Renders inline/display KaTeX math formulas and embedded markdown images.
 */
const MathViewContent: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  // On-the-fly normalization: ensures chemical formulas (CO2, O2) and unwrapped LaTeX (\text{CO_2})
  // are properly formatted as KaTeX math without causing red parse errors
  const processedContent = React.useMemo(() => {
    return normalizeMathFormulas(content);
  }, [content]);

  // Split by markdown images: ![alt](src)
  const imageRegex = /(!\[.*?\]\(.*?\))/g;
  const imageParts = processedContent.split(imageRegex);

  return (
    <>
      {imageParts.map((imgPart, imgIndex) => {
        const imgMatch = imgPart.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          const alt = imgMatch[1] || 'Hình vẽ';
          let src = imgMatch[2];

          // Auto-convert legacy WMF/EMF images to native browser SVG on the fly
          if (
            src.startsWith('data:image/x-wmf;base64,') ||
            src.startsWith('data:image/x-emf;base64,') ||
            src.startsWith('data:image/wmf;base64,')
          ) {
            try {
              const base64Data = src.split(',')[1];
              if (typeof window !== 'undefined') {
                const binaryStr = window.atob(base64Data);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                  bytes[i] = binaryStr.charCodeAt(i);
                }
                const converted = convertWmfToSvg(bytes);
                src = converted.dataUrl;
              }
            } catch (err) {
              console.warn('On-the-fly WMF conversion error in MathView:', err);
            }
          }

          return (
            <img
              key={imgIndex}
              src={src}
              alt={alt}
              className="my-1 inline-block max-h-72 max-w-full rounded-lg border border-gray-100 shadow-xs object-contain bg-white align-middle"
            />
          );
        }

        // Split by $$...$$ (display) and $...$ (inline)
        const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
        const parts = imgPart.split(regex);

        return (
          <React.Fragment key={imgIndex}>
            {parts.map((part, index) => {
              if (part.startsWith('$$') && part.endsWith('$$')) {
                const formula = sanitizeLatexFormula(part.slice(2, -2).trim());
                try {
                  const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
                  return (
                    <span
                      key={index}
                      className="my-2 block overflow-x-auto text-center"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                } catch {
                  return <span key={index} className="font-mono text-sm text-gray-800">{part}</span>;
                }
              } else if (part.startsWith('$') && part.endsWith('$')) {
                const formula = sanitizeLatexFormula(part.slice(1, -1).trim());
                try {
                  const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
                  return (
                    <span
                      key={index}
                      className="inline-block px-0.5 align-middle max-w-full overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                } catch {
                  return <span key={index} className="font-mono text-sm text-gray-800">{part}</span>;
                }
              } else {
                return <React.Fragment key={index}>{part}</React.Fragment>;
              }
            })}
          </React.Fragment>
        );
      })}
    </>
  );
};

export const MathView: React.FC<MathViewProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const segments = parseMarkdownTables(content);

  // If no tables are detected, render directly using inline MathViewContent
  if (segments.length === 1 && segments[0].type === 'text') {
    return (
      <span className={`inline ${className}`}>
        <MathViewContent content={content} />
      </span>
    );
  }

  // Render multi-part content with structured Markdown tables
  return (
    <div className={`space-y-2 ${className}`}>
      {segments.map((segment, sIdx) => {
        if (segment.type === 'text') {
          return (
            <div key={sIdx} className="inline leading-relaxed">
              <MathViewContent content={segment.value} />
            </div>
          );
        }

        // Render responsive, styled data table
        return (
          <div
            key={sIdx}
            className="my-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs max-w-full"
          >
            <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-800 border-collapse">
              {segment.headers.length > 0 && (
                <thead className="bg-slate-100 font-semibold text-slate-800">
                  {segment.headers.map((hRow, rIdx) => (
                    <tr key={rIdx} className="divide-x divide-slate-200">
                      {hRow.map((cell, cIdx) => (
                        <th
                          key={cIdx}
                          className="px-3.5 py-2.5 text-center font-bold text-slate-800 whitespace-normal bg-slate-100"
                        >
                          <MathViewContent content={cell} />
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
              )}
              <tbody className="divide-y divide-slate-200 bg-white">
                {segment.rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={`divide-x divide-slate-200 transition-colors ${
                      rIdx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
                    } hover:bg-indigo-50/40`}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-3.5 py-2 text-center text-slate-700 whitespace-normal"
                      >
                        <MathViewContent content={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};
