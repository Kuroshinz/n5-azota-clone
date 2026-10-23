'use client';

import React from 'react';
import katex from 'katex';

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
    <span className={`inline-block ${className}`}>
      {imageParts.map((imgPart, imgIndex) => {
        const imgMatch = imgPart.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          const alt = imgMatch[1] || 'Hình vẽ';
          const src = imgMatch[2];
          return (
            <img
              key={imgIndex}
              src={src}
              alt={alt}
              className="my-3 block max-h-80 max-w-full rounded-xl border border-gray-200 shadow-sm object-contain bg-white"
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
                  return <span key={index} className="text-red-500">{part}</span>;
                }
              } else if (part.startsWith('$') && part.endsWith('$')) {
                const formula = part.slice(1, -1).trim();
                try {
                  const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
                  return (
                    <span
                      key={index}
                      className="inline-block px-0.5"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                } catch {
                  return <span key={index} className="text-red-500">{part}</span>;
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
