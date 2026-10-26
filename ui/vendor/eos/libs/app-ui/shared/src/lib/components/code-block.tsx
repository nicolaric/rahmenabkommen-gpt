import { Check, Code2, Copy, SquareTerminal, WrapText } from 'lucide-react';
import * as React from 'react';
import './code-block.css';

// The highlighter and each grammar are only fetched once a code block shows.
const CodeHighlight = React.lazy(() => import('./code-highlight'));

export type CodeBlockLabels = {
  code: string;
  copy: string;
  copied: string;
  wrap: string;
};

const DEFAULT_CODE_BLOCK_LABELS: CodeBlockLabels = {
  code: 'Code',
  copy: 'Copy',
  copied: 'Copied',
  wrap: 'Wrap lines',
};

const LANGUAGE_NAMES: Record<string, string> = {
  bash: 'Bash',
  c: 'C',
  cpp: 'C++',
  cs: 'C#',
  csharp: 'C#',
  css: 'CSS',
  diff: 'Diff',
  dockerfile: 'Dockerfile',
  go: 'Go',
  graphql: 'GraphQL',
  html: 'HTML',
  java: 'Java',
  javascript: 'JavaScript',
  js: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  kotlin: 'Kotlin',
  markdown: 'Markdown',
  md: 'Markdown',
  php: 'PHP',
  powershell: 'PowerShell',
  ps1: 'PowerShell',
  py: 'Python',
  python: 'Python',
  rb: 'Ruby',
  ruby: 'Ruby',
  rs: 'Rust',
  rust: 'Rust',
  sh: 'Shell',
  shell: 'Shell',
  sql: 'SQL',
  swift: 'Swift',
  toml: 'TOML',
  ts: 'TypeScript',
  tsx: 'TSX',
  typescript: 'TypeScript',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',
  zsh: 'Zsh',
};

const TERMINAL_LANGUAGES: ReadonlySet<string> = new Set([
  'bash',
  'console',
  'powershell',
  'ps1',
  'sh',
  'shell',
  'terminal',
  'zsh',
]);

// Prism grammar names for the common short aliases.
const PRISM_ALIASES: Record<string, string> = {
  js: 'javascript',
  md: 'markdown',
  ps1: 'powershell',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  sh: 'bash',
  shell: 'bash',
  ts: 'typescript',
  yml: 'yaml',
  zsh: 'bash',
};

export function languageName(language: string | null): string | null {
  if (!language) return null;
  return LANGUAGE_NAMES[language] ?? language;
}

/** The fence language from a `language-xyz` class, lower-cased. */
export function languageFromClassName(className?: string): string | null {
  const match = className?.match(/(?:^|\s)language-([\w+#-]+)/);
  return match ? match[1].toLowerCase() : null;
}

type HastNode = {
  type: string;
  value?: unknown;
  children?: HastNode[];
};

/** The text of a hast node tree, as react-markdown hands it to renderers. */
export function hastText(node: HastNode | null | undefined): string {
  if (!node) return '';
  if (node.type === 'text') return String(node.value ?? '');
  return node.children ? node.children.map(hastText).join('') : '';
}

const actionButton =
  'inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-none aria-pressed:text-foreground';

// Within this distance of the end, the pane follows newly streamed lines.
const STICK_TO_BOTTOM_PX = 24;

/**
 * A fenced code block: language label, wrap toggle and copy button on top, the
 * code in a pane of limited height that scrolls on its own.
 */
export function CodeBlock({
  code,
  language,
  labels = DEFAULT_CODE_BLOCK_LABELS,
}: {
  code: string;
  language: string | null;
  labels?: CodeBlockLabels;
}) {
  const [wrap, setWrap] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const paneRef = React.useRef<HTMLDivElement>(null);
  const atBottomRef = React.useRef(true);
  const text = code.replace(/\n$/, '');
  const name = languageName(language);
  const Icon =
    language && TERMINAL_LANGUAGES.has(language) ? SquareTerminal : Code2;

  // While an answer streams, the pane stays on its newest line unless the
  // reader has scrolled up.
  React.useLayoutEffect(() => {
    const pane = paneRef.current;
    if (pane && atBottomRef.current) pane.scrollTop = pane.scrollHeight;
  }, [text]);

  const onScroll = () => {
    const pane = paneRef.current;
    if (!pane) return;
    atBottomRef.current =
      pane.scrollHeight - pane.scrollTop - pane.clientHeight <
      STICK_TO_BOTTOM_PX;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the code stays selectable.
    }
  };

  const plain = <code>{text}</code>;
  const grammar = language ? (PRISM_ALIASES[language] ?? language) : null;

  return (
    <div
      data-code-block=""
      className="code-block not-prose my-4 min-w-0 overflow-clip rounded-2xl border border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div className="flex min-h-11 select-none items-center gap-2 py-1.5 pe-1.5 ps-4 font-sans text-sm font-medium">
        <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1 truncate">{name ?? labels.code}</div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className={actionButton}
            aria-pressed={wrap}
            aria-label={labels.wrap}
            title={labels.wrap}
            onClick={() => setWrap((value) => !value)}
          >
            <WrapText className="size-4" />
          </button>
          <button
            type="button"
            className={actionButton}
            aria-label={copied ? labels.copied : labels.copy}
            title={copied ? labels.copied : labels.copy}
            onClick={copy}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>
      </div>
      <div
        ref={paneRef}
        onScroll={onScroll}
        tabIndex={0}
        className="code-block-pane max-h-[28rem] overflow-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <pre
          dir="ltr"
          className={`m-0 bg-transparent px-4 pb-4 pt-0 font-mono text-[13px] leading-6 ${wrap ? 'whitespace-pre-wrap break-words' : 'min-w-max whitespace-pre'}`}
        >
          {grammar ? (
            <React.Suspense fallback={plain}>
              <CodeHighlight code={text} language={grammar} />
            </React.Suspense>
          ) : (
            plain
          )}
        </pre>
      </div>
    </div>
  );
}
