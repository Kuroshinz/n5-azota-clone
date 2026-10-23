'use client';

import React from 'react';
import katex from 'katex';

interface MathViewProps {
  content: string;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split by $$...$$ (display) and $...$ (inline)
  const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
  const parts = content.split(regex);

  return (
    <span className={`inline-block ${className}`}>
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
    </span>
  );
};
