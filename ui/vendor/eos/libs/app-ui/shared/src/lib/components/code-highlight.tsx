import type * as React from 'react';
import { PrismAsyncLight } from 'react-syntax-highlighter';

const Fragment = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

/**
 * Prism tokens as `token keyword`-style class names; the colours come from
 * code-block.css so they follow the app theme. Grammars load on demand, and
 * the text shows unhighlighted until its grammar has arrived.
 */
export default function CodeHighlight({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  return (
    <PrismAsyncLight
      language={language}
      useInlineStyles={false}
      PreTag={Fragment}
      CodeTag="code"
    >
      {code}
    </PrismAsyncLight>
  );
}
