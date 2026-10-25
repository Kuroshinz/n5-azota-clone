'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import { convertWmfToSvg } from '../parser/wmfConverter';

interface MathViewProps {
  content: string;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split by markdown images: ![alt](src)
  const imageRegex = /(!\[.*?\]\(.*?\))/g;
  const imageParts = content.split(imageRegex);

  return (
    <span className={`inline ${className}`}>
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
                const formula = part.slice(2, -2).trim();
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
                const formula = part.slice(1, -1).trim();
                try {
                  const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
                  return (
                    <span
                      key={index}
                      className="inline-block px-0.5 align-middle"
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
    </span>
  );
};
