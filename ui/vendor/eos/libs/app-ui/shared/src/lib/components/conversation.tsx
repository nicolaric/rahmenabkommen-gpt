import {
  Button,
  MessageScrollerContent,
  MessageScrollerItem,
  Table,
  useMessageScroller,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@eos/shared/ui';
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Clock3,
  Copy,
  FileText,
  FileUp,
  Pencil,
  PlugZap,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import * as React from 'react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Markdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import './katex-overrides.css';
import './streaming-words.css';
import { buildDocumentsPath } from '../routing';
import { ClarificationForm } from './clarification-form';
import { CodeBlock, hastText, languageFromClassName } from './code-block';
import { ConversationDocumentCard } from './conversation-document-card';
import { ConversationGeneratedAttachment } from './conversation-generated-attachment';
import {
  ChartLabelsContext,
  type ChartLabels,
} from './generative-ui/chart-block';
import {
  ChecklistLabelsContext,
  type ChecklistLabels,
} from './generative-ui/checklist-block';
import {
  ResourceLabelsContext,
  type ResourceLabels,
} from './generative-ui/resource-block';
import {
  EmailLabelsContext,
  type EmailLabels,
} from './generative-ui/email-block';
import { GenerativeUiBlock } from './generative-ui/generative-ui-block';
import { rehypeNumericTableColumns } from './numeric-table-columns';
import { rehypeStreamWords } from './rehype-stream-words';
import { toFallbackMarkdown } from './generative-ui/parse';
import {
  maskIncompleteInlineMarkup,
  splitStreamingContent,
} from './streaming-markdown';
import {
  PassageAskButton,
  QuoteCard,
  splitQuotedQuestion,
} from './passage-ask-button';
import { LiveQuestionBubble } from './live-question-bubble';
import { ConversationAttachmentChip } from './conversation-attachment-card';
import { SourcesModal } from './source-sheet';
import {
  buildThinkingPanels,
  createThinkingStepTools,
  formatTiming,
  ThinkingPanel,
} from './thinking-panel';
import {
  InlineCitation,
  InlineCitationAction,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationClaim,
  InlineCitationGroup,
  InlineCitationGroupItem,
  type InlineCitationKind,
  InlineCitationKindIcon,
  InlineCitationPassages,
  InlineCitationQuote,
  InlineCitationSection,
  InlineCitationSource,
} from './inline-citation';

const DOC_CITATION_RUN = /^(?:\[Doc \d+\][\s,;]*)*\[Doc \d+\]$/i;

export function webCitationHost(citation: {
  file_id?: unknown;
  source_url?: unknown;
}): string | null {
  if (citation.file_id || typeof citation.source_url !== 'string') return null;
  try {
    const url = new URL(citation.source_url);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.hostname.replace(/^www\./, '')
      : null;
  } catch {
    return null;
  }
}

const FILE_EXTENSION =
  /\.(?:pdf|docx?|dotx|xlsx?|xlsm|csv|ods|pptx?|odt|odp|rtf|txt|md|msg|eml|html?|json|xml)$/i;
const SPREADSHEET_EXTENSION = /\.(?:xlsx?|xlsm|csv|ods)$/i;
const VIDEO_EXTENSION = /\.(?:mp4|webm|mov|avi|mkv|ogv)$/i;

// The source viewers are only fetched when a cited document is opened.
const PdfViewer = React.lazy(() => import('./pdf-viewer'));
const VideoViewer = React.lazy(() => import('./video-viewer'));

export type CitationViewer = {
  kind: 'pdf' | 'video';
  fileUrl: string;
  fileName: string;
  snippet?: string;
  pages: number[];
};

export type CitationOpenAction =
  | { type: 'link'; href: string; download?: string }
  | { type: 'viewer'; viewer: CitationViewer };

/**
 * How a cited source opens: PDFs and videos in the in-app viewers, web pages
 * in a new tab, any other file as a download. Null when there is nothing to
 * open.
 */
export function citationOpenAction(
  citation: any,
  file: { name?: string; file_type?: string } | undefined,
  fileUrl: (fileId: string) => string,
): CitationOpenAction | null {
  if (webCitationHost(citation)) {
    return { type: 'link', href: citation.source_url };
  }
  if (typeof citation.file_id !== 'string' || !citation.file_id) return null;

  const url = fileUrl(citation.file_id);
  const name: string =
    file?.name ??
    citation.document_name ??
    citation.file_name ??
    citation.filename ??
    '';
  const type = String(
    file?.file_type ?? citation.file_type ?? '',
  ).toLowerCase();
  const viewer = {
    fileUrl: url,
    fileName: name,
    snippet: citation.snippet ?? undefined,
    pages: Array.isArray(citation.page_numbers)
      ? citation.page_numbers.filter(Boolean)
      : [],
  };
  const isPdf = type
    ? type === 'application/pdf' || type === 'pdf'
    : /\.pdf$/i.test(name);
  if (isPdf) return { type: 'viewer', viewer: { kind: 'pdf', ...viewer } };
  const isVideo = type
    ? type === 'video' || type.startsWith('video/')
    : VIDEO_EXTENSION.test(name);
  if (isVideo) return { type: 'viewer', viewer: { kind: 'video', ...viewer } };
  return { type: 'link', href: url, download: name };
}

/**
 * A readable name for a source chip: no file extension, underscores as
 * spaces. `Projekthandbuch_v3_final.pdf` → `Projekthandbuch v3 final`. The chip
 * truncates long names visually; the full name stays in the hover card.
 */
export function shortSourceName(title: string): string {
  const name = title
    .replace(FILE_EXTENSION, '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return name || title;
}

/** `Bericht.final.pdf` → `PDF`; names without a known extension give null. */
export function fileTypeLabel(title: string): string | null {
  const match = title.match(FILE_EXTENSION);
  return match ? match[0].slice(1).toUpperCase() : null;
}

/** `[3, 4, 5, 8]` → `3–5, 8`. */
export function formatPageRanges(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const ranges: string[] = [];
  for (let start = 0; start < sorted.length; ) {
    let end = start;
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end] + 1) {
      end += 1;
    }
    ranges.push(
      end > start ? `${sorted[start]}–${sorted[end]}` : String(sorted[start]),
    );
    start = end + 1;
  }
  return ranges.join(', ');
}

/**
 * A retrieved chunk reads as prose in the hover card: markdown heading,
 * quote and list markers, emphasis and runs of whitespace are dropped.
 */
export function cleanSnippet(snippet: string): string {
  return snippet
    .replace(/^\s{0,3}(?:#{1,6}|>|[-*+]|\d+[.)])\s+/gm, '')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits the text before a chip into what precedes the claim, the claim (the
 * last sentence, which the chip supports) and the whitespace after it.
 */
export function splitClaim(text: string): [string, string, string] {
  const match = text.match(/^([\s\S]*[.!?:]\s+)?(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return [text, '', ''];
  const [, before = '', lead, claim, trail] = match;
  return [before + lead, claim, trail];
}

function SourceChipLabel({
  kind,
  name,
  more = 0,
}: {
  kind: InlineCitationKind;
  name: string;
  more?: number;
}) {
  return (
    <>
      <InlineCitationKindIcon kind={kind} />
      <span className="min-w-0 truncate">{name}</span>
      {more > 0 ? <span className="shrink-0 opacity-70">+{more}</span> : null}
    </>
  );
}

// Chips show the full source name and only truncate when it doesn't fit the
// line or container (e.g. a stat tile): `min-w-0` lets the chip shrink inside
// the `max-w-full` wrapper. No percentage max-width, as that makes the wrapper
// reserve the untruncated width and leaves a gap after the chip.
const SOURCE_CHIP_CLASSES = 'min-w-0 gap-1 font-medium align-[-0.2em]';

const interactiveTargetSelector =
  'button, a, input, textarea, select, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="textbox"], [role="checkbox"], [role="radio"], [role="switch"], [role="menuitem"], [role="combobox"], [role="slider"], [role="spinbutton"], [tabindex]:not([tabindex="-1"])';

const getInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return target.closest(interactiveTargetSelector);
};

const isBrainCitation = (citation: any) =>
  citation?.source_type === 'brain_signal' ||
  citation?.source_type === 'brain_claim' ||
  citation?.entry_kind === 'signal' ||
  citation?.entry_kind === 'claim';

const getBrainCitations = (message: any): any[] => {
  const explicit = Array.isArray(message?.brain_citations)
    ? message.brain_citations
    : [];
  if (explicit.length > 0) return explicit;

  return Array.isArray(message?.citations)
    ? message.citations.filter(isBrainCitation)
    : [];
};

const getMessageCitations = (message: any): any[] => {
  const citations = Array.isArray(message?.citations) ? message.citations : [];
  const brainCitations = getBrainCitations(message);
  const existingRefs = new Set(
    citations
      .map((citation: any) => citation?.display_ref)
      .filter((ref: unknown): ref is string => typeof ref === 'string'),
  );

  return [
    ...citations,
    ...brainCitations.filter(
      (citation) => !existingRefs.has(citation?.display_ref),
    ),
  ];
};

type FileMetadata = {
  name: string;
  file_type?: string;
};

type MarkdownComponents = React.ComponentProps<typeof Markdown>['components'];

type MarkdownSegmentProps = {
  content: string;
  /** For the streaming tail: ms since the character at an offset appeared. */
  wordAge?: (offset: number) => number;
  citations?: any[];
  components: MarkdownComponents;
  citationContextVersion: unknown;
  streaming?: boolean;
};

// Revealing a short run on each animation frame prevents a large SSE chunk
// from appearing as a single, jarring jump, while still catching up quickly
// enough to stay close to the incoming stream.
const STREAM_REVEAL_CHARACTERS_PER_SECOND = 480;

function useSmoothedStreamingText(content: string, streaming: boolean) {
  const [displayedContent, setDisplayedContent] = useState(content);
  const displayedContentRef = useRef(content);
  const targetContentRef = useRef(content);
  const frameRef = useRef<number | null>(null);
  const previousFrameTimeRef = useRef<number | null>(null);

  const cancelFrame = React.useCallback(() => {
    if (frameRef.current == null || typeof window === 'undefined') return;

    if (typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(frameRef.current);
    } else {
      window.clearTimeout(frameRef.current);
    }
    frameRef.current = null;
  }, []);

  const revealNextFrame = React.useCallback((timestamp: number) => {
    frameRef.current = null;
    const current = displayedContentRef.current;
    const target = targetContentRef.current;
    if (current === target) return;

    const elapsed = Math.max(
      16,
      timestamp - (previousFrameTimeRef.current ?? timestamp - 16),
    );
    previousFrameTimeRef.current = timestamp;
    const charactersToReveal = Math.max(
      1,
      Math.ceil((elapsed / 1000) * STREAM_REVEAL_CHARACTERS_PER_SECOND),
    );
    const next = target.slice(0, current.length + charactersToReveal);
    displayedContentRef.current = next;
    setDisplayedContent(next);
  }, []);

  const scheduleFrame = React.useCallback(() => {
    if (frameRef.current != null || typeof window === 'undefined') return;

    if (typeof window.requestAnimationFrame === 'function') {
      frameRef.current = window.requestAnimationFrame(revealNextFrame);
    } else {
      frameRef.current = window.setTimeout(
        () => revealNextFrame(Date.now()),
        16,
      );
    }
  }, [revealNextFrame]);

  useEffect(() => {
    targetContentRef.current = content;

    // Completed messages and replacement text must remain immediately
    // accurate. Streaming content is append-only; a different prefix means a
    // retry or edit replaced it, so it should not animate from stale text.
    if (!streaming || !content.startsWith(displayedContentRef.current)) {
      cancelFrame();
      previousFrameTimeRef.current = null;
      displayedContentRef.current = content;
      setDisplayedContent(content);
      return;
    }

    if (content !== displayedContentRef.current) {
      scheduleFrame();
    }
  }, [cancelFrame, content, scheduleFrame, streaming]);

  useEffect(() => {
    if (displayedContentRef.current !== targetContentRef.current) {
      scheduleFrame();
    }
  }, [displayedContent, scheduleFrame]);

  useEffect(() => cancelFrame, [cancelFrame]);

  return displayedContent;
}

const MarkdownSegment = React.memo(
  ({ content, components, streaming, wordAge }: MarkdownSegmentProps) => (
    // The mutable tail is parsed on every token so formatting appears as it
    // streams rather than only when a blank line commits the paragraph.
    // Delimiters the stream has opened but not closed are masked first, so a
    // half-written `**bo` reads as plain text instead of flashing its markers.
    // Only the streaming tail wraps its words for the fade-in; finished
    // segments render plain text.
    <Markdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={
        streaming
          ? [
              rehypeKatex,
              rehypeNumericTableColumns,
              [rehypeStreamWords, { ageAt: wordAge }],
            ]
          : [rehypeKatex, rehypeNumericTableColumns]
      }
      components={components}
    >
      {streaming ? maskIncompleteInlineMarkup(content) : content}
    </Markdown>
  ),
  (previous, next) =>
    previous.content === next.content &&
    previous.citations === next.citations &&
    previous.citationContextVersion === next.citationContextVersion &&
    previous.streaming === next.streaming,
);

// A finished block is frozen like a finished Markdown segment; only the block
// that is still streaming re-renders as tokens arrive.
const UiSegment = React.memo(
  ({ content, components, streaming }: MarkdownSegmentProps) => (
    <GenerativeUiBlock
      source={content}
      components={components}
      streaming={streaming}
    />
  ),
  (previous, next) =>
    previous.content === next.content &&
    previous.citations === next.citations &&
    previous.citationContextVersion === next.citationContextVersion &&
    previous.streaming === next.streaming,
);

/** Translated toolbar labels for the cards inside generative UI blocks. */
function BlockLabelsProvider({
  chart,
  checklist,
  email,
  resource,
  children,
}: {
  chart: ChartLabels;
  checklist: ChecklistLabels;
  email: EmailLabels;
  resource: ResourceLabels;
  children: React.ReactNode;
}) {
  return (
    <ChartLabelsContext.Provider value={chart}>
      <ChecklistLabelsContext.Provider value={checklist}>
        <EmailLabelsContext.Provider value={email}>
          <ResourceLabelsContext.Provider value={resource}>
            {children}
          </ResourceLabelsContext.Provider>
        </EmailLabelsContext.Provider>
      </ChecklistLabelsContext.Provider>
    </ChartLabelsContext.Provider>
  );
}

type RevealMark = { length: number; time: number };

const revealNow = () =>
  typeof performance === 'undefined' ? Date.now() : performance.now();

/**
 * Remembers when each part of a streaming text first became visible, so the
 * word fade-in can tell new words from ones already shown, even when the
 * paragraph is re-rendered from scratch. Text present when streaming starts,
 * or text that replaced an earlier version, counts as already shown.
 */
function useRevealAges(text: string) {
  const marksRef = useRef<RevealMark[] | null>(null);
  const textRef = useRef('');
  if (marksRef.current === null || !text.startsWith(textRef.current)) {
    marksRef.current = [{ length: text.length, time: -Infinity }];
  } else if (text.length > textRef.current.length) {
    marksRef.current.push({ length: text.length, time: revealNow() });
  }
  textRef.current = text;

  const marks = marksRef.current;
  // One clock reading per render, so words revealed together get exactly the
  // same age and can be staggered as a batch.
  const now = revealNow();
  return (index: number) => {
    const mark = marks.find((entry) => entry.length > index);
    return mark ? now - mark.time : 0;
  };
}

function MessageContent({
  content,
  citations,
  components,
  citationContextVersion,
  streaming = false,
}: MarkdownSegmentProps) {
  const displayedContent = useSmoothedStreamingText(content, streaming);
  const revealAge = useRevealAges(displayedContent);
  const segments = React.useMemo(
    () => splitStreamingContent(displayedContent, streaming),
    [displayedContent, streaming],
  );

  return (
    <>
      {segments.map((segment, index) => {
        const Segment = segment.type === 'ui' ? UiSegment : MarkdownSegment;
        const isStreamingTail =
          streaming &&
          index === segments.length - 1 &&
          (segment.type === 'markdown' || !segment.closed);
        // The tail is a suffix of the displayed text; offsets inside it map
        // to the message by its start position.
        const tailStart =
          isStreamingTail && segment.type === 'markdown'
            ? displayedContent.lastIndexOf(segment.text)
            : -1;
        return (
          <Segment
            key={`${segment.type}-${index}`}
            content={segment.type === 'ui' ? segment.source : segment.text}
            citations={citations}
            components={components}
            citationContextVersion={citationContextVersion}
            streaming={isStreamingTail}
            wordAge={
              tailStart >= 0
                ? (offset) => revealAge(tailStart + offset)
                : undefined
            }
          />
        );
      })}
    </>
  );
}

function OrganizationWelcomeContent({
  messageId,
  title,
  content,
}: {
  messageId: string;
  title: string;
  content: string;
}) {
  const [visibleContent, setVisibleContent] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      setVisibleContent(content);
      return;
    }

    const storageKey = `organization-welcome-streamed:${messageId}`;
    if (window.sessionStorage.getItem(storageKey)) {
      setVisibleContent(content);
      return;
    }

    window.sessionStorage.setItem(storageKey, 'true');
    const charactersPerTick = Math.max(1, Math.ceil(content.length / 80));
    let index = 0;
    const timer = window.setInterval(() => {
      index = Math.min(content.length, index + charactersPerTick);
      setVisibleContent(content.slice(0, index));
      if (index === content.length) {
        window.clearInterval(timer);
      }
    }, 16);

    return () => window.clearInterval(timer);
  }, [content, messageId]);

  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
        {title}
      </p>
      <div aria-live="polite" data-testid="organization-welcome-content">
        {visibleContent.split('\n\n').map((paragraph, index) => (
          <p key={index} className={index > 0 ? 'mt-3' : undefined}>
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}

function ToolCallCard({ block }: { block: any }) {
  const details = block.args ?? block.result;
  const detailsText =
    details == null
      ? null
      : typeof details === 'string'
        ? details
        : JSON.stringify(details, null, 2);

  return (
    <details className="not-prose my-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-slate-700 dark:text-slate-200">
        <span>{block.name}</span>
        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
          {block.status}
        </span>
      </summary>
      {block.summary && (
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {block.summary}
        </p>
      )}
      {detailsText && (
        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-black/5 p-2 text-xs text-slate-600 dark:bg-black/20 dark:text-slate-300">
          {detailsText}
        </pre>
      )}
    </details>
  );
}

export function ConversationComponent({
  messages,
  scrollToMessageId,
  hideWorkingStatus = false,
  statusMessage,
  statusTimings,
  activeTeamId,
  activeWorkspaceId,
  isSending,
  traceEventsByMessageId,
  outputBlocksByMessageId = {},
  agentNameById,
  onEditLastMessage,
  disableEdit,
  showSources = true,
  documentOptions = [],
  followUpQuestions = [],
  clarificationQuestions = [],
  onFollowUpQuestion,
  onAskAboutPassage,
}: any) {
  // Start at 0 rather than the initial message count: swissmem-ui only mounts
  // this component once the first question exists (its empty state is a
  // separate tree), so seeding with the mount-time count would make that first
  // question look like pre-existing history and skip the scroll. Mounting with
  // messages already present but nothing being sent still can't scroll - the
  // `isSending` guard below holds it back.
  const prevMessageCountRef = useRef(0);
  const pendingScrollRef = useRef(false);
  const handledScrollToMessageIdRef = useRef<string | null>(null);
  const lastQuestionRef = useRef<HTMLDivElement | null>(null);
  const messagePartRefs = useRef<Array<HTMLDivElement | null>>([]);
  const { holdScrollPosition, scrollToAnchor, viewportHeight } =
    useMessageScroller();
  const { t } = useTranslation('conversation');
  const apiUrl = import.meta.env.VITE_API_URL;
  const [fileMetadata, setFileMetadata] = useState<
    Record<string, FileMetadata>
  >({});
  const fetchedFileMetadataIdsRef = useRef(new Set<string>());
  const [citationViewer, setCitationViewer] = useState<CitationViewer | null>(
    null,
  );

  useEffect(() => {
    const fileIdsSet = new Set<string>();
    (messages ?? []).forEach((message: any) => {
      [...(message.sources ?? []), ...(message.citations ?? [])].forEach(
        (source: any) => {
          const fileId = source?.file_id;
          if (typeof fileId === 'string' && fileId.length > 0) {
            fileIdsSet.add(fileId);
          }
        },
      );
      if (message.document_context?.scope === 'selected') {
        (message.document_context.document_ids ?? []).forEach(
          (fileId: unknown) => {
            if (typeof fileId === 'string' && fileId.length > 0) {
              fileIdsSet.add(fileId);
            }
          },
        );
      }
    });
    const fileIds = Array.from(fileIdsSet);
    const toFetch = fileIds.filter(
      (fileId) =>
        !fileMetadata[fileId] && !fetchedFileMetadataIdsRef.current.has(fileId),
    );

    if (!activeTeamId || toFetch.length === 0) return;

    const searchParams = new URLSearchParams({ organizationId: activeTeamId });
    if (activeWorkspaceId) {
      searchParams.set('workspaceId', activeWorkspaceId);
    }

    fetch(`${apiUrl}/files/batch-metadata?${searchParams.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_ids: toFetch }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Metadata fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setFileMetadata((prev) => {
          const next = { ...prev };
          (data.files ?? []).forEach((item: any) => {
            if (item.file_id) {
              next[item.file_id] = {
                name: item.name ?? t('sourceDetails.unnamedFile'),
                file_type: item.file_type ?? item.content_type,
              };
            }
          });
          return next;
        });
        toFetch.forEach((fileId) =>
          fetchedFileMetadataIdsRef.current.add(fileId),
        );
      })
      .catch((err) => {
        console.error('Failed to load citation file metadata:', err);
      });
  }, [activeTeamId, activeWorkspaceId, apiUrl, fileMetadata, messages, t]);

  const agentBadgePalette = [
    'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/30',
    'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30',
    'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30',
    'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/30',
    'bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/30',
    'bg-teal-100 text-teal-700 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-200 dark:ring-teal-500/30',
    'bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-200 dark:ring-orange-500/30',
    'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-200 dark:ring-fuchsia-500/30',
  ];

  const hashAgentId = (value: string) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }
    return hash;
  };

  const getAgentBadgeClass = (agentId: string) => {
    if (!agentId) return agentBadgePalette[0];
    const index = hashAgentId(agentId) % agentBadgePalette.length;
    return agentBadgePalette[index];
  };

  const getAgentLabel = (message: any) => {
    const agentId = message?.agent_id;
    if (!agentId) return null;
    const name = message?.agent_name || agentNameById?.[agentId];
    if (name) return name;
    return `Agent ${agentId.slice(0, 8)}`;
  };

  // Local state for ratings to give immediate feedback
  const [localRatings, setLocalRatings] = useState<Record<string, number>>({});
  const [localFeedbackTexts, setLocalFeedbackTexts] = useState<
    Record<string, string | null>
  >({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>(
    {},
  );
  const [feedbackEditorMessageId, setFeedbackEditorMessageId] = useState<
    string | null
  >(null);
  const [submittingFeedback, setSubmittingFeedback] = useState<
    Record<string, boolean>
  >({});
  const [copiedContentKey, setCopiedContentKey] = useState<string | null>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const latestMessageId = messages?.[messages.length - 1]?.id;

  useEffect(() => {
    setEditingMessageId(null);
    setEditedQuestion('');
  }, [latestMessageId]);

  const handleRate = async (
    messageId: string,
    rating: number,
    feedbackText?: string,
  ): Promise<boolean> => {
    try {
      setSubmittingFeedback((prev) => ({ ...prev, [messageId]: true }));
      const response = await fetch(
        `${apiUrl}/conversations/messages/${messageId}/rating?organizationId=${activeTeamId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating,
            feedback_text: feedbackText?.trim() || null,
          }),
        },
      );
      if (response.ok) {
        setLocalRatings((prev) => ({ ...prev, [messageId]: rating }));
        setLocalFeedbackTexts((prev) => ({
          ...prev,
          [messageId]: rating < 0 ? feedbackText?.trim() || null : null,
        }));
        if (rating > 0) {
          setFeedbackEditorMessageId((current) =>
            current === messageId ? null : current,
          );
          setFeedbackDrafts((prev) => ({ ...prev, [messageId]: '' }));
        }
        return true;
      }
    } catch (error) {
      console.error('Failed to rate message:', error);
    } finally {
      setSubmittingFeedback((prev) => ({ ...prev, [messageId]: false }));
    }

    return false;
  };

  const handleThumbsDown = (message: any) => {
    const existingFeedback =
      localFeedbackTexts[message.id] ?? message.feedback_text ?? '';
    setFeedbackDrafts((prev) => ({
      ...prev,
      [message.id]: prev[message.id] ?? existingFeedback,
    }));
    setFeedbackEditorMessageId(message.id);
  };

  const submitNegativeFeedback = async (messageId: string) => {
    const saved = await handleRate(
      messageId,
      -1,
      feedbackDrafts[messageId] ?? '',
    );
    if (saved) {
      setFeedbackEditorMessageId((current) =>
        current === messageId ? null : current,
      );
    }
  };

  const handleCopy = async (contentKey: string, text: string | undefined) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedContentKey(contentKey);

      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopiedContentKey((current) =>
          current === contentKey ? null : current,
        );
      }, 1500);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  useEffect(() => {
    const count = messages?.length ?? 0;
    const grew = count > prevMessageCountRef.current;
    const latestMessageId = messages?.[count - 1]?.id;
    const explicitScrollIsReady =
      Boolean(scrollToMessageId) &&
      latestMessageId === scrollToMessageId &&
      handledScrollToMessageIdRef.current !== scrollToMessageId;
    prevMessageCountRef.current = count;

    // Most consumers can infer a newly submitted question from history
    // growing while streaming starts. Consumers that own local history can
    // provide the request/message id explicitly so subscription batching
    // cannot hide that transition.
    if (grew) {
      pendingScrollRef.current = true;
    }
    if (explicitScrollIsReady) {
      handledScrollToMessageIdRef.current = scrollToMessageId;
    }

    if (!explicitScrollIsReady && (!pendingScrollRef.current || !isSending)) {
      return;
    }
    pendingScrollRef.current = false;

    // Pin the new question near the top of the viewport instead of letting
    // it stay at the bottom. Without this, the streaming answer's own
    // content mutations trigger the scroller's stick-to-bottom behavior on
    // every chunk, which wins the race against this smooth scroll and snaps
    // the view straight back down before it can finish.
    holdScrollPosition();
    // Scroll the message viewport itself rather than letting scrollIntoView
    // pick a scrollable ancestor: which ancestor that is depends on how the
    // embedding page is laid out, so the same call moved the view in one app
    // and did nothing in another. scrollToAnchor always targets the viewport
    // and lands the turn just below its top edge.
    if (latestMessageId && scrollToAnchor) {
      scrollToAnchor(latestMessageId);
      return;
    }
    lastQuestionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [
    messages,
    isSending,
    scrollToMessageId,
    holdScrollPosition,
    scrollToAnchor,
  ]);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  const isNestedInteractiveTarget = (
    target: EventTarget | null,
    currentTarget: HTMLDivElement,
  ) => {
    const interactiveElement = getInteractiveTarget(target);

    return Boolean(interactiveElement && interactiveElement !== currentTarget);
  };

  const scrollMessagePartToStart = (element: HTMLDivElement | null) => {
    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const focusMessagePartAtIndex = (index: number) => {
    const element = messagePartRefs.current[index];
    element?.focus({ preventScroll: true });
    scrollMessagePartToStart(element ?? null);
  };

  useEffect(() => {
    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      if (
        document.querySelector(
          '[data-conversation-keyboard-nav-disabled="true"]',
        )
      ) {
        return;
      }

      const messagePartElements = messagePartRefs.current.filter(Boolean);
      if (!messagePartElements.length) return;

      const activeElement = document.activeElement;
      const focusIsInsideMessagePart = messagePartElements.some(
        (messagePartElement) =>
          messagePartElement === activeElement ||
          (activeElement instanceof Node &&
            messagePartElement?.contains(activeElement)),
      );

      if (focusIsInsideMessagePart || getInteractiveTarget(event.target))
        return;

      event.preventDefault();
      if (event.key === 'ArrowDown') {
        focusMessagePartAtIndex(0);
      } else {
        focusMessagePartAtIndex(messagePartElements.length - 1);
      }
    };

    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [messages.length]);

  const handleMessagePartKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    partIndex: number,
  ) => {
    if (isNestedInteractiveTarget(event.target, event.currentTarget)) return;

    const maxPartIndex = messages.length * 2 - 1;

    if (event.key === 'ArrowDown' && partIndex < maxPartIndex) {
      event.preventDefault();
      focusMessagePartAtIndex(partIndex + 1);
    }

    if (event.key === 'ArrowUp' && partIndex > 0) {
      event.preventDefault();
      focusMessagePartAtIndex(partIndex - 1);
    }
  };

  const { buildThinkingSteps, isHiddenWorkingStep } = createThinkingStepTools(
    t,
    { hideWorkingStatus },
  );

  const describeDocCitation = (citation: any) => {
    // A web page has a URL but no file; it is named by its domain. No
    // favicon is fetched, so no third-party request reveals what was cited.
    const webHost = webCitationHost(citation);
    const sourceTitle: string =
      webHost ??
      fileMetadata[citation.file_id]?.name ??
      citation.document_name ??
      citation.source ??
      citation.file_name ??
      citation.filename ??
      String(citation.display_ref ?? citation.file_id ?? '').replace(
        /^\[|\]$/g,
        '',
      );
    const isImage = citation.content_type === 'image';
    const kind: InlineCitationKind = webHost
      ? 'web'
      : isImage
        ? 'image'
        : SPREADSHEET_EXTENSION.test(sourceTitle)
          ? 'sheet'
          : 'file';
    let webPath: string | null = null;
    if (webHost) {
      try {
        const { pathname } = new URL(citation.source_url);
        webPath = pathname.length > 1 ? decodeURIComponent(pathname) : null;
      } catch {
        webPath = null;
      }
    }

    return {
      // Passages from one document count as one source in a group.
      key: String(citation.file_id ?? webHost ?? sourceTitle),
      kind,
      name: webHost ?? shortSourceName(sourceTitle),
      title: sourceTitle,
      // Under the name: the file type, or the page path for a website.
      detail: webHost ? webPath : fileTypeLabel(sourceTitle),
    };
  };

  const citationPages = (citation: any): number[] =>
    Array.isArray(citation.page_numbers)
      ? citation.page_numbers
          .map(Number)
          .filter((page: number) => Number.isInteger(page) && page > 0)
      : [];

  const pagesLabel = (pages: number[]) =>
    pages.length
      ? `${pages.length === 1 ? t('sourceDetails.page') : t('sourceDetails.pages')} ${formatPageRanges(pages)}`
      : undefined;

  const fileContextQuery = `organizationId=${activeTeamId}${activeWorkspaceId ? `&workspaceId=${activeWorkspaceId}` : ''}`;

  const renderCitationAction = (citation: any) => {
    const action = citationOpenAction(
      citation,
      citation.file_id ? fileMetadata[citation.file_id] : undefined,
      (fileId) => `${apiUrl}/files/${fileId}/download?${fileContextQuery}`,
    );
    if (!action) return null;

    if (action.type === 'viewer') {
      const [page] = action.viewer.pages;
      return (
        <InlineCitationAction
          label={
            page
              ? t('sourceDetails.openAtPage', { page })
              : t('sourceDetails.openFile')
          }
          onClick={() => setCitationViewer(action.viewer)}
        />
      );
    }
    return (
      <InlineCitationAction
        label={
          webCitationHost(citation)
            ? t('sourceDetails.openWebsite')
            : t('sourceDetails.openFile')
        }
        href={action.href}
        download={action.download}
      />
    );
  };

  const renderCitationPassage = (citation: any, labelled: boolean) => {
    const imageUrl =
      citation.content_type === 'image' && citation.image_id
        ? `${apiUrl}/files/${citation.file_id}/images/${citation.image_id}?${fileContextQuery}`
        : null;
    const snippet =
      typeof citation.snippet === 'string'
        ? cleanSnippet(citation.snippet)
        : '';
    if (!imageUrl && !snippet) return null;

    return (
      <React.Fragment key={String(citation.display_ref)}>
        {imageUrl ? (
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-border/60 bg-muted/40"
          >
            <img
              src={imageUrl}
              alt="Extracted image"
              className="h-auto max-h-40 w-full object-contain"
              loading="lazy"
            />
          </a>
        ) : null}
        {snippet ? (
          <InlineCitationQuote
            label={labelled ? pagesLabel(citationPages(citation)) : undefined}
          >
            {snippet}
          </InlineCitationQuote>
        ) : null}
      </React.Fragment>
    );
  };

  /** The passages cited from one source, then the way to open it. */
  const renderSourceBody = (sourceCitations: any[]) => {
    const passages = sourceCitations
      .map((citation) =>
        renderCitationPassage(citation, sourceCitations.length > 1),
      )
      .filter(Boolean);
    return (
      <>
        {passages.length ? (
          <InlineCitationPassages>{passages}</InlineCitationPassages>
        ) : null}
        {renderCitationAction(sourceCitations[0])}
      </>
    );
  };

  const renderSourceSummary = (
    source: ReturnType<typeof describeDocCitation>,
    sourceCitations: any[],
  ) => (
    <InlineCitationSource
      kind={source.kind}
      title={source.name}
      fullTitle={source.title}
      meta={
        [
          source.detail,
          pagesLabel(
            sourceCitations.flatMap((citation) => citationPages(citation)),
          ),
        ]
          .filter(Boolean)
          .join(' · ') || undefined
      }
    />
  );

  const renderBrainCitation = (
    citation: any,
    number: string,
    index: number,
  ) => {
    const content =
      citation?.extracted_content ?? citation?.summary ?? citation?.snippet;
    const kindLabel = !citation
      ? undefined
      : citation.source_type === 'brain_claim' ||
          citation.entry_kind === 'claim'
        ? t('sourceDetails.brainClaim')
        : t('sourceDetails.brainSignal');
    const created = citation?.created_at ? new Date(citation.created_at) : null;
    const date =
      created && !Number.isNaN(created.getTime())
        ? created.toLocaleDateString(undefined, { dateStyle: 'medium' })
        : undefined;
    const meta = [kindLabel, date].filter(Boolean).join(' · ') || undefined;

    return (
      <InlineCitation key={`brain-citation-${index}`}>
        <InlineCitationCard>
          <InlineCitationCardTrigger
            sources={[]}
            aria-label={`Brain ${number}`}
            className={SOURCE_CHIP_CLASSES}
          >
            <InlineCitationKindIcon kind="brain" />
            <span>Brain</span>
          </InlineCitationCardTrigger>
          <InlineCitationCardBody>
            <InlineCitationSection>
              <InlineCitationSource kind="brain" title="Brain" meta={meta} />
            </InlineCitationSection>
            {typeof content === 'string' && content.trim() ? (
              <InlineCitationPassages>
                <InlineCitationQuote>
                  {cleanSnippet(content)}
                </InlineCitationQuote>
              </InlineCitationPassages>
            ) : null}
          </InlineCitationCardBody>
        </InlineCitationCard>
      </InlineCitation>
    );
  };

  /** One chip, or null when the marker resolves to nothing to show. */
  const renderCitationPart = (
    part: string,
    index: number,
    citations: any[] | undefined,
  ): React.ReactNode => {
    const brainMatch = part.match(/^\[Brain (\d+)\]$/i);
    if (brainMatch) {
      const refId = `[Brain ${brainMatch[1]}]`;
      const citation = citations?.find(
        (item) => item.display_ref?.toLowerCase() === refId.toLowerCase(),
      );
      return renderBrainCitation(citation, brainMatch[1], index);
    }

    const numbers = [...part.matchAll(/\[Doc (\d+)\]/gi)].map(
      (docMatch) => docMatch[1],
    );

    // While the answer streams (no citation list yet), source names are
    // not known: show a quiet placeholder. A finished answer whose
    // citations never arrived drops the marker; its sources stay
    // reachable through the message's source details.
    if (citations && citations.length === 0) return null;
    if (!citations) {
      return (
        <span
          key={`citation-pending-${index}`}
          data-testid="citation-pending-badge"
          aria-hidden="true"
          className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-primary/20 bg-primary/5 px-1.5 align-[-0.2em] text-primary/60"
        >
          <FileText className="size-3" />
        </span>
      );
    }

    // Only markers that resolve to a known citation are shown; unknown
    // ones are dropped, as for a single marker.
    const resolved = numbers.flatMap((number) => {
      const refId = `[Doc ${number}]`;
      const citation = citations.find(
        (c) => c.display_ref?.toLowerCase() === refId.toLowerCase(),
      );
      return citation ? [citation] : [];
    });
    if (resolved.length === 0) return null;

    const groups: {
      source: ReturnType<typeof describeDocCitation>;
      citations: any[];
    }[] = [];
    for (const citation of resolved) {
      const source = describeDocCitation(citation);
      const group = groups.find((other) => other.source.key === source.key);
      if (group) group.citations.push(citation);
      else groups.push({ source, citations: [citation] });
    }
    const [first] = groups;

    return (
      <InlineCitation key={`citation-${index}`}>
        <InlineCitationCard>
          <InlineCitationCardTrigger
            sources={[]}
            aria-label={groups.map(({ source }) => source.title).join(', ')}
            className={SOURCE_CHIP_CLASSES}
          >
            <SourceChipLabel
              kind={first.source.kind}
              name={first.source.name}
              more={groups.length - 1}
            />
          </InlineCitationCardTrigger>
          <InlineCitationCardBody>
            {groups.length === 1 ? (
              <>
                <InlineCitationSection>
                  {renderSourceSummary(first.source, first.citations)}
                </InlineCitationSection>
                {renderSourceBody(first.citations)}
              </>
            ) : (
              <>
                <InlineCitationSection className="border-b border-border/60 py-2 text-xs font-medium text-muted-foreground">
                  {t('sourceDetails.sourceCount', { count: groups.length })}
                </InlineCitationSection>
                <InlineCitationGroup defaultValue={first.source.key}>
                  {groups.map(({ source, citations: sourceCitations }) => (
                    <InlineCitationGroupItem
                      key={source.key}
                      value={source.key}
                      summary={renderSourceSummary(source, sourceCitations)}
                    >
                      {renderSourceBody(sourceCitations)}
                    </InlineCitationGroupItem>
                  ))}
                </InlineCitationGroup>
              </>
            )}
          </InlineCitationCardBody>
        </InlineCitationCard>
      </InlineCitation>
    );
  };

  const renderInlineCitations = (
    node: React.ReactNode,
    citations?: any[],
  ): React.ReactNode => {
    if (!node) {
      return node;
    }

    if (typeof node === 'string') {
      // Hide an in-progress citation tag while it is still streaming in; it
      // reappears as plain text if the trailing characters form another token.
      const text = node.replace(
        /\[(?:d|do|doc|b|br|bra|brai|brain)?(?: ?\d*)?$/i,
        '',
      );
      // Adjacent `[Doc N]` markers (only spaces, commas or semicolons between
      // them) are split out as one run and render as a single grouped chip.
      // Odd entries are the markers, even ones the text between them.
      const parts = text.split(
        /(\[Brain \d+\]|(?:\[Doc \d+\][\s,;]*)*\[Doc \d+\])/gi,
      );
      const chips = parts.map((part, index) =>
        index % 2 === 1 &&
        (/^\[Brain \d+\]$/i.test(part) || DOC_CITATION_RUN.test(part))
          ? renderCitationPart(part, index, citations)
          : undefined,
      );

      return parts.map((part, index) => {
        if (index % 2 === 1) return chips[index] ?? '';
        // The sentence right before a chip lights up while it is hovered.
        const next = chips[index + 1];
        if (!React.isValidElement(next) || next.type !== InlineCitation) {
          return part;
        }
        const [before, claim, trail] = splitClaim(part);
        if (!claim) return part;
        return (
          <React.Fragment key={`claim-${index}`}>
            {before}
            <InlineCitationClaim>{claim}</InlineCitationClaim>
            {trail}
          </React.Fragment>
        );
      });
    }

    if (Array.isArray(node)) {
      return node.map((child, index) => (
        <React.Fragment key={`citation-node-${index}`}>
          {renderInlineCitations(child, citations)}
        </React.Fragment>
      ));
    }

    if (React.isValidElement(node)) {
      if (node.type === 'pre') {
        return node;
      }

      const element = node as React.ReactElement<{
        children?: React.ReactNode;
      }>;

      if (
        node.type === 'code' &&
        typeof element.props.children === 'string' &&
        /\[(?:Doc|Brain) \d+\]/i.test(element.props.children)
      ) {
        return renderInlineCitations(element.props.children, citations);
      }

      return React.cloneElement(element, {
        children: renderInlineCitations(element.props.children, citations),
      });
    }

    return node;
  };

  const renderMarkdownChildren = (props: any, citations?: any[]) =>
    renderInlineCitations(props.children, citations);

  const chartLabels = React.useMemo(
    () => ({
      showData: t('chart.showData'),
      hideData: t('chart.hideData'),
      copyCsv: t('chart.copyCsv'),
      copied: t('chart.copied'),
      label: t('chart.label'),
    }),
    [t],
  );

  const codeBlockLabels = React.useMemo(
    () => ({
      code: t('codeBlock.code'),
      copy: t('codeBlock.copy'),
      copied: t('codeBlock.copied'),
      wrap: t('codeBlock.wrap'),
    }),
    [t],
  );

  const checklistLabels = React.useMemo(
    () => ({
      label: t('checklist.label'),
      progress: (done: number, total: number) =>
        t('checklist.progress', { done, total }),
      copy: t('checklist.copy'),
      copied: t('checklist.copied'),
    }),
    [t],
  );

  const resourceLabels = React.useMemo(
    () => ({ open: t('resource.open') }),
    [t],
  );

  const emailLabels = React.useMemo(
    () => ({
      label: t('email.label'),
      recipient: t('email.recipient'),
      subject: t('email.subject'),
      body: t('email.body'),
      copy: t('email.copy'),
      copied: t('email.copied'),
      openInMail: t('email.openInMail'),
    }),
    [t],
  );

  const getMarkdownComponents = (citations?: any[]) => ({
    table: (props: any) => <Table {...props} />,
    tr: (props: any) => <TableRow {...props} />,
    th: (props: any) => (
      <TableHead {...props}>
        {renderMarkdownChildren(props, citations)}
      </TableHead>
    ),
    td: (props: any) => (
      <TableCell {...props}>
        {renderMarkdownChildren(props, citations)}
      </TableCell>
    ),
    hr: (props: any) => <hr {...props} />,
    pre: ({ node }: any) => {
      const code = node?.children?.find(
        (child: any) => child.type === 'element' && child.tagName === 'code',
      );
      const className = code?.properties?.className;
      return (
        <CodeBlock
          code={hastText(code ?? node)}
          language={languageFromClassName(
            Array.isArray(className) ? className.join(' ') : className,
          )}
          labels={codeBlockLabels}
        />
      );
    },
    ul: (props: any) => (
      <ul className="ml-6 list-disc" {...props}>
        {renderMarkdownChildren(props, citations)}
      </ul>
    ),
    ol: (props: any) => (
      <ol className="ml-6 list-decimal" {...props}>
        {renderMarkdownChildren(props, citations)}
      </ol>
    ),
    h1: (props: any) => (
      <h1 {...props}>{renderMarkdownChildren(props, citations)}</h1>
    ),
    h2: (props: any) => (
      <h2 {...props}>{renderMarkdownChildren(props, citations)}</h2>
    ),
    h3: (props: any) => (
      <h3 {...props}>{renderMarkdownChildren(props, citations)}</h3>
    ),
    a: (props: any) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className={`break-words [overflow-wrap:anywhere] ${props.className ?? ''}`}
      >
        {renderMarkdownChildren(props, citations)}
      </a>
    ),
    p: (props: any) => (
      <p {...props}>{renderMarkdownChildren(props, citations)}</p>
    ),
    li: (props: any) => (
      <li {...props}>{renderMarkdownChildren(props, citations)}</li>
    ),
    blockquote: (props: any) => (
      <blockquote {...props}>
        {renderMarkdownChildren(props, citations)}
      </blockquote>
    ),
  });

  return (
    <BlockLabelsProvider
      chart={chartLabels}
      checklist={checklistLabels}
      email={emailLabels}
      resource={resourceLabels}
    >
      <MessageScrollerContent className="mx-auto w-full max-w-3xl grow min-w-0 gap-6 bg-background p-4 dark:bg-[#0a0a0a]">
        {messages?.map((msg: any, index: any) => {
          const isLast = index === messages.length - 1;
          if (msg.dictating) {
            /* The question the user is still talking: only its bubble, which
               is replaced by the sent question once they stop. */
            return (
              <MessageScrollerItem
                key={msg.id || index}
                messageId={msg.id || String(index)}
                scrollAnchor
                anchorLabel={msg.question ?? ''}
                role="article"
                aria-label={`Conversation message ${index + 1} of ${messages.length}`}
                className={`flex w-full min-w-0 flex-col gap-2 rounded-xl ${isLast ? 'min-h-[80vh] scroll-mt-4' : 'min-h-0'}`}
                style={
                  isLast && viewportHeight
                    ? { minHeight: viewportHeight }
                    : undefined
                }
              >
                <LiveQuestionBubble text={msg.question ?? ''} />
              </MessageScrollerItem>
            );
          }
          const brainSources = getBrainCitations(msg);
          const resolvedCitations = getMessageCitations(msg);
          // `undefined` tells the citation renderer the list may still arrive.
          const messageCitations =
            resolvedCitations.length === 0 && isLast && isSending
              ? undefined
              : resolvedCitations;
          const hasSources =
            (msg.sources && msg.sources.length > 0) || brainSources.length > 0;
          const traceEvents =
            traceEventsByMessageId?.[msg.traceRequestId ?? msg.id] ?? [];
          const streamedToolWebTraces = [
            ...traceEvents
              .filter((event: any) => event.type === 'webfetch_info')
              .map((event: any) => ({
                kind: 'web',
                url: event.url,
                bytes: event.bytes,
                status: event.status,
                content_type: event.content_type,
                request_preview: event.request_preview,
                response_preview: event.response_preview,
              })),
            ...traceEvents
              .filter((event: any) => event.type === 'external_tool_info')
              .map((event: any) => ({
                kind: 'tool',
                tool_name: event.tool_name,
                url: event.url,
                status: event.status,
                bytes: event.bytes,
                request_preview: event.request_preview,
                response_preview: event.response_preview,
              })),
          ];
          const toolWebTraces =
            msg.tool_web_traces && msg.tool_web_traces.length > 0
              ? msg.tool_web_traces
              : streamedToolWebTraces;
          const hasToolWebTraces = toolWebTraces && toolWebTraces.length > 0;
          const hasTrace = traceEvents.length > 0;
          const statusTraceEvents = traceEvents.filter(
            (event: any) => event.type === 'status' && event.timings,
          );
          const latestTraceTimings = statusTraceEvents.length
            ? statusTraceEvents[statusTraceEvents.length - 1].timings
            : null;
          const messageTimings =
            isLast && statusTimings ? statusTimings : latestTraceTimings;
          // Use DB rating or local state if just clicked
          const currentRating = localRatings[msg.id] ?? msg.rating;
          const currentFeedbackText =
            localFeedbackTexts[msg.id] ?? msg.feedback_text ?? '';
          const isFeedbackEditorOpen = feedbackEditorMessageId === msg.id;
          const feedbackDraft = feedbackDrafts[msg.id] ?? '';
          const isSubmittingFeedback = submittingFeedback[msg.id] ?? false;
          const questionCopyKey = `question:${msg.id}`;
          const responseCopyKey = `response:${msg.id}`;
          const isOrganizationWelcome =
            msg.message_kind === 'organization_welcome';
          const messageDocumentContext = msg.document_context;
          const explicitContextItems =
            messageDocumentContext?.scope === 'selected'
              ? (messageDocumentContext.document_ids ?? []).map(
                  (id: string) => {
                    const document = documentOptions.find(
                      (candidate: any) => candidate.id === id,
                    );
                    const fileType =
                      document?.fileType ?? fileMetadata[id]?.file_type;
                    return {
                      value: id,
                      label: document?.name ?? fileMetadata[id]?.name ?? id,
                      description: fileType
                        ? String(fileType).toUpperCase()
                        : String(t('documentContext.document' as never)),
                      kind: 'document' as const,
                    };
                  },
                )
              : messageDocumentContext?.scope === 'tagged'
                ? (messageDocumentContext.document_tags ?? []).map(
                    (tag: string) => ({
                      value: tag,
                      label: tag,
                      description: String(t('documentContext.tag' as never)),
                      kind: 'tag' as const,
                    }),
                  )
                : [];
          const welcomeActions = isOrganizationWelcome
            ? [
                {
                  id: 'upload_documents',
                  label: String(t('welcome.actions.uploadDocuments' as never)),
                  title: String(t('welcome.cards.documents.title' as never)),
                  description: String(
                    t('welcome.cards.documents.description' as never),
                  ),
                  detail: String(t('welcome.cards.documents.detail' as never)),
                  icon: FileUp,
                  accent:
                    'from-cyan-500/15 via-sky-500/10 to-transparent dark:from-cyan-400/20 dark:via-sky-400/10',
                  iconClass:
                    'bg-cyan-500 text-white shadow-cyan-500/30 dark:bg-cyan-400 dark:text-slate-950',
                },
                {
                  id: 'connect_tools',
                  label: String(t('welcome.actions.connectTools' as never)),
                  title: String(t('welcome.cards.tools.title' as never)),
                  description: String(
                    t('welcome.cards.tools.description' as never),
                  ),
                  detail: String(t('welcome.cards.tools.detail' as never)),
                  icon: PlugZap,
                  accent:
                    'from-amber-400/20 via-orange-500/10 to-transparent dark:from-amber-300/20 dark:via-orange-400/10',
                  iconClass:
                    'bg-amber-400 text-amber-950 shadow-amber-500/30 dark:bg-amber-300',
                },
              ]
            : [];
          const suggestedActions = msg.suggested_actions ?? [];
          const outputBlocks =
            outputBlocksByMessageId?.[msg.traceRequestId ?? msg.id] ?? [];
          const currentThinkingSteps = buildThinkingSteps(traceEvents).filter(
            (step) => !isHiddenWorkingStep(step),
          );
          const {
            panels: mergedThinkingPanels,
            hasInterleavedThinking,
            lastThinkingGroupId,
          } = buildThinkingPanels(traceEvents, outputBlocks);
          const renderThinkingPanel = (
            events: any[],
            panelKey: string,
            isActive: boolean,
          ) => (
            <ThinkingPanel
              panelKey={panelKey}
              events={events}
              traceEvents={traceEvents}
              isActive={isActive}
              isSending={isSending}
              fallbackElapsed={messageTimings?.response_time ?? null}
              hideWorkingStatus={hideWorkingStatus}
            />
          );
          const canEditQuestion =
            isLast &&
            onEditLastMessage &&
            !disableEdit &&
            !isSending &&
            !statusMessage;
          const isEditingQuestion = editingMessageId === msg.id;
          // A passage asked about is shown as a quote card above the question.
          const quotedQuestion = splitQuotedQuestion(msg.question ?? '');
          const questionPartIndex = index * 2;
          const responsePartIndex = questionPartIndex + 1;
          const focusablePartClassName =
            'transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-gray-700';
          return (
            <MessageScrollerItem
              key={msg.traceRequestId || msg.id || index}
              messageId={msg.id || String(index)}
              scrollAnchor={Boolean(msg.question)}
              anchorLabel={typeof msg.question === 'string' ? msg.question : ''}
              role="article"
              aria-label={`Conversation message ${index + 1} of ${messages.length}`}
              className={`flex w-full min-w-0 flex-col gap-2 rounded-xl ${isLast ? 'min-h-[80vh] scroll-mt-4' : 'min-h-0'}`}
              // The trailing turn reserves a full viewport of room so its
              // question can reach the top of the scroller; `80vh` above is only
              // the fallback for the first render, before the measurement lands.
              style={
                isLast && viewportHeight
                  ? { minHeight: viewportHeight }
                  : undefined
              }
            >
              {/* Question Box */}
              <div
                ref={(element) => {
                  messagePartRefs.current[questionPartIndex] = element;
                  if (isLast) {
                    lastQuestionRef.current = element;
                  }
                }}
                tabIndex={0}
                aria-label={`Question ${index + 1} of ${messages.length}`}
                onKeyDown={(event) =>
                  handleMessagePartKeyDown(event, questionPartIndex)
                }
                className={
                  msg.question
                    ? `group/question mx-0 flex min-w-0 max-w-full flex-col items-end gap-1 self-end rounded-lg sm:mx-2 ${focusablePartClassName}`
                    : 'hidden'
                }
              >
                {!isEditingQuestion && msg.attachments?.length > 0 && (
                  /* Files sent with the question; not openable yet. */
                  <div
                    className="mt-1 flex max-w-[80%] flex-wrap justify-end gap-1.5"
                    data-testid="message-attachments"
                  >
                    {msg.attachments.map((attachment: any) => (
                      <ConversationAttachmentChip
                        key={attachment.id}
                        name={attachment.name}
                        fileType={attachment.file_type}
                      />
                    ))}
                  </div>
                )}
                {!isEditingQuestion && explicitContextItems.length > 0 && (
                  <div
                    className="flex w-full flex-col items-end gap-1 empty:hidden rtl:items-start"
                    data-testid="message-document-context"
                  >
                    <div className="mt-1 flex max-w-[80%] flex-wrap justify-end gap-2">
                      {explicitContextItems.map((item: any) => (
                        <ConversationDocumentCard
                          key={item.value}
                          label={item.label}
                          description={item.description}
                          kind={item.kind}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className="min-w-0 max-w-full rounded-l-xl rounded-t-xl rounded-br-sm border border-gray-200 bg-gray-100 p-2 dark:border-gray-800 dark:bg-gray-900">
                  {isEditingQuestion ? (
                    <div className="flex min-w-72 flex-col gap-2">
                      <textarea
                        value={editedQuestion}
                        onChange={(event) =>
                          setEditedQuestion(event.target.value)
                        }
                        className="min-h-24 resize-y rounded-md border border-gray-300 bg-background p-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring dark:border-gray-700"
                        aria-label={t('editQuestion.label')}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditedQuestion('');
                          }}
                        >
                          {t('editQuestion.cancel')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!editedQuestion.trim()}
                          onClick={() => {
                            const nextQuestion = editedQuestion.trim();
                            if (!nextQuestion) return;
                            setEditingMessageId(null);
                            onEditLastMessage(msg.id, nextQuestion);
                          }}
                        >
                          {t('editQuestion.save')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {quotedQuestion.quote ? (
                        <QuoteCard
                          className="mb-2"
                          surfaceClassName="bg-white/70 dark:bg-white/5"
                          text={quotedQuestion.quote}
                        />
                      ) : null}
                      <div className="prose prose-neutral min-w-0 max-w-none break-words [overflow-wrap:anywhere] dark:text-gray-100">
                        <Markdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={getMarkdownComponents()}
                        >
                          {quotedQuestion.question}
                        </Markdown>
                      </div>
                    </>
                  )}
                </div>
                {!isEditingQuestion ? (
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover/question:opacity-100 focus-within:opacity-100">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-6 w-6 px-0"
                          disabled={!msg.question}
                          aria-label={
                            copiedContentKey === questionCopyKey
                              ? t('actions.copied')
                              : t('actions.copyQuestion')
                          }
                          onClick={() =>
                            handleCopy(questionCopyKey, msg.question)
                          }
                        >
                          {copiedContentKey === questionCopyKey ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-gray-500" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center">
                        {copiedContentKey === questionCopyKey
                          ? t('actions.copied')
                          : t('actions.copyQuestion')}
                      </TooltipContent>
                    </Tooltip>
                    {canEditQuestion ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-6 w-6 px-0"
                            aria-label={t('editQuestion.label')}
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditedQuestion(msg.question ?? '');
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center">
                          {t('editQuestion.label')}
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Answer Box */}
              <div
                ref={(element) => {
                  messagePartRefs.current[responsePartIndex] = element;
                }}
                tabIndex={0}
                aria-label={`Response ${index + 1} of ${messages.length}`}
                onKeyDown={(event) =>
                  handleMessagePartKeyDown(event, responsePartIndex)
                }
                className={`w-full min-w-0 self-start rounded-lg p-2 text-gray-800 dark:text-gray-200 ${focusablePartClassName}`}
              >
                <div
                  data-answer-text=""
                  className="prose prose-gray min-w-0 max-w-none break-words dark:prose-invert"
                >
                  {msg.agent_id ? (
                    <div className="mb-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getAgentBadgeClass(
                          msg.agent_id,
                        )}`}
                        title={msg.agent_id}
                      >
                        {getAgentLabel(msg)}
                      </span>
                    </div>
                  ) : null}
                  {!hasInterleavedThinking &&
                    isLast &&
                    (isSending || hasTrace) &&
                    (!hideWorkingStatus || currentThinkingSteps.length > 0) &&
                    renderThinkingPanel(
                      traceEvents,
                      `${msg.id}-thinking`,
                      true,
                    )}

                  {isOrganizationWelcome ? (
                    <OrganizationWelcomeContent
                      messageId={msg.id}
                      title={String(t('welcome.title' as never))}
                      content={String(t('welcome.message' as never))}
                    />
                  ) : outputBlocks.length > 0 ? (
                    <div data-testid="interleaved-output-blocks">
                      {hasInterleavedThinking &&
                        mergedThinkingPanels
                          .filter(
                            ({ outputBlockIndex }) => outputBlockIndex == null,
                          )
                          .map((panel) => (
                            <React.Fragment key={panel.key}>
                              {renderThinkingPanel(
                                panel.events,
                                panel.key,
                                false,
                              )}
                            </React.Fragment>
                          ))}
                      {outputBlocks.map((block: any, blockIndex: number) => (
                        <React.Fragment key={block.id}>
                          {block.type === 'tool_call' ? (
                            <ToolCallCard block={block} />
                          ) : (
                            <MessageContent
                              content={block.text}
                              citations={messageCitations}
                              components={getMarkdownComponents(
                                messageCitations,
                              )}
                              citationContextVersion={fileMetadata}
                              streaming={
                                isLast &&
                                isSending &&
                                blockIndex === outputBlocks.length - 1
                              }
                            />
                          )}
                          {hasInterleavedThinking &&
                            mergedThinkingPanels
                              .filter(
                                ({ outputBlockIndex }) =>
                                  outputBlockIndex === blockIndex,
                              )
                              .map((panel) => (
                                <React.Fragment key={panel.key}>
                                  {renderThinkingPanel(
                                    panel.events,
                                    panel.key,
                                    panel.lastGroupId === lastThinkingGroupId &&
                                      blockIndex === outputBlocks.length - 1,
                                  )}
                                </React.Fragment>
                              ))}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <MessageContent
                      content={msg.answer}
                      citations={messageCitations}
                      components={getMarkdownComponents(messageCitations)}
                      citationContextVersion={fileMetadata}
                      streaming={isLast && isSending}
                    />
                  )}

                  {Array.isArray(msg.generated_attachments) &&
                    msg.generated_attachments.length > 0 && (
                      <div
                        className="not-prose mt-4 space-y-2"
                        aria-label="Generated attachments"
                      >
                        {msg.generated_attachments.map((attachment: any) => (
                          <ConversationGeneratedAttachment
                            key={attachment.artifact_id}
                            apiUrl={apiUrl}
                            organizationId={activeTeamId}
                            workspaceId={activeWorkspaceId}
                            attachment={attachment}
                          />
                        ))}
                      </div>
                    )}

                  {welcomeActions.length > 0 && (
                    <div
                      className="not-prose mt-5 grid max-w-2xl gap-3 sm:grid-cols-2"
                      aria-label="Suggested next steps"
                    >
                      {welcomeActions.map((action, actionIndex) => {
                        const href =
                          action.id === 'upload_documents'
                            ? buildDocumentsPath({ orgId: activeTeamId })
                            : `/${activeTeamId}/tools`;
                        const Icon = action.icon;

                        return (
                          <motion.div
                            key={action.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.35,
                              delay: 0.15 + actionIndex * 0.1,
                              ease: 'easeOut',
                            }}
                          >
                            <Link
                              to={href}
                              className="group relative flex h-full min-h-64 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_42px_-20px_rgba(15,23,42,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20 dark:hover:shadow-black/30"
                            >
                              <div
                                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${action.accent}`}
                              />
                              <div className="relative flex items-start justify-between">
                                <span
                                  className={`flex size-11 items-center justify-center rounded-xl shadow-lg ${action.iconClass}`}
                                >
                                  <Icon className="size-5" aria-hidden="true" />
                                </span>
                                <ArrowUpRight className="size-5 text-slate-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-900 dark:text-slate-500 dark:group-hover:text-white" />
                              </div>
                              <div className="relative mt-7">
                                <h3 className="text-base font-semibold tracking-tight text-slate-950 dark:text-white">
                                  {action.title}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                  {action.description}
                                </p>
                              </div>
                              <div className="relative mt-auto border-t border-slate-200/70 pt-4 text-xs font-medium text-slate-500 dark:border-white/10 dark:text-slate-400">
                                {action.detail}
                                <span className="ml-2 text-primary transition-colors group-hover:text-primary/80">
                                  {action.label}
                                </span>
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {suggestedActions.length > 0 && (
                    <div className="not-prose mt-4 flex flex-wrap gap-2">
                      {suggestedActions.map((action: any) => {
                        const href =
                          action.id === 'upload_documents'
                            ? buildDocumentsPath({ orgId: activeTeamId })
                            : `/${activeTeamId}/agents/new`;
                        return (
                          <Button key={action.id} asChild variant="outline">
                            <Link to={href}>{action.label}</Link>
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer Area: Ratings + Sources */}
                  {!isOrganizationWelcome && (
                    <div className="mt-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
                      {/* Sublte Rating Buttons - nur anzeigen wenn Antwort fertig ist */}
                      {!isLast ||
                      (msg.answer &&
                        msg.answer.trim().length > 0 &&
                        !isSending &&
                        !statusMessage) ? (
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => handleRate(msg.id, 1)}
                                variant="ghost"
                                className="h-6 w-6 px-0"
                                aria-label={t('actions.rateUp')}
                              >
                                <ThumbsUp
                                  className={
                                    currentRating === 1 ? '' : 'text-gray-500'
                                  }
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="center">
                              {t('actions.rateUp')}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => handleThumbsDown(msg)}
                                variant="ghost"
                                className="h-6 w-6 px-0"
                                aria-label={t('actions.rateDown')}
                              >
                                <ThumbsDown
                                  className={
                                    currentRating === -1 ? '' : 'text-gray-500'
                                  }
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="center">
                              {t('actions.rateDown')}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() =>
                                  handleCopy(
                                    responseCopyKey,
                                    msg.answer
                                      ? toFallbackMarkdown(msg.answer)
                                      : msg.answer,
                                  )
                                }
                                variant="ghost"
                                className="h-6 w-6 px-0"
                                disabled={!msg.answer}
                                aria-label={
                                  copiedContentKey === responseCopyKey
                                    ? t('actions.copied')
                                    : t('actions.copyResponse')
                                }
                              >
                                {copiedContentKey === responseCopyKey ? (
                                  <Check />
                                ) : (
                                  <Copy className="text-gray-500" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="center">
                              {copiedContentKey === responseCopyKey
                                ? t('actions.copied')
                                : t('actions.copyResponse')}
                            </TooltipContent>
                          </Tooltip>
                          {canEditQuestion && msg.question?.trim() ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() =>
                                    onEditLastMessage(msg.id, msg.question)
                                  }
                                  variant="ghost"
                                  className="h-6 w-6 px-0"
                                  aria-label={t('actions.regenerate')}
                                >
                                  <RefreshCw className="text-gray-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" align="center">
                                {t('actions.regenerate')}
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
                          {!isSending && !statusMessage && messageTimings && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex h-6 w-6 items-center justify-center text-gray-500 hover:text-foreground transition-colors"
                                  aria-label={t('thinking.responseTiming')}
                                >
                                  <Clock3 className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" align="start">
                                <div className="font-mono">
                                  {t('thinking.timeToFirstChunk')}:{' '}
                                  {formatTiming(
                                    messageTimings.time_to_first_chunk,
                                  )}
                                  <br />
                                  {t('thinking.timeToFirstToken')}:{' '}
                                  {formatTiming(
                                    messageTimings.time_to_first_token,
                                  )}
                                  <br />
                                  {t('thinking.responseTime')}:{' '}
                                  {formatTiming(messageTimings.response_time)}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      ) : null}

                      {showSources && (hasSources || hasToolWebTraces) && (
                        <SourcesModal
                          sources={msg.sources}
                          brainSources={brainSources}
                          toolWebTraces={toolWebTraces}
                          apiUrl={apiUrl}
                          activeTeamId={activeTeamId}
                          activeWorkspaceId={activeWorkspaceId}
                          t={t as any}
                        />
                      )}
                    </div>
                  )}
                  {!isOrganizationWelcome &&
                    (isFeedbackEditorOpen || currentFeedbackText) && (
                      <div className="mt-2 max-w-xl animate-in fade-in slide-in-from-top-1 duration-200">
                        {isFeedbackEditorOpen ? (
                          <div className="rounded-lg border border-gray-200 bg-background p-2 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                            <label
                              htmlFor={`feedback-${msg.id}`}
                              className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
                            >
                              {t('feedback.label')}
                            </label>
                            <textarea
                              id={`feedback-${msg.id}`}
                              value={feedbackDraft}
                              maxLength={2000}
                              onChange={(event) =>
                                setFeedbackDrafts((prev) => ({
                                  ...prev,
                                  [msg.id]: event.target.value,
                                }))
                              }
                              placeholder={t('feedback.placeholder')}
                              className="min-h-20 w-full resize-y rounded-md border border-gray-300 bg-background p-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring dark:border-gray-700"
                            />
                            <div className="mt-2 flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setFeedbackEditorMessageId(null)}
                              >
                                {t('feedback.cancel')}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                disabled={isSubmittingFeedback}
                                onClick={() => submitNegativeFeedback(msg.id)}
                              >
                                {t('feedback.submit')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-400">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {t('feedback.savedLabel')}
                            </span>{' '}
                            {currentFeedbackText}
                          </p>
                        )}
                      </div>
                    )}
                  {/* Questions the agent asked back: like follow-ups, only
                      under the finished latest answer and never persisted.
                      The picks go out as an ordinary next message. */}
                  {isLast &&
                    !isOrganizationWelcome &&
                    !isSending &&
                    !statusMessage &&
                    onFollowUpQuestion &&
                    clarificationQuestions.length > 0 && (
                      <ClarificationForm
                        questions={clarificationQuestions}
                        onSubmit={onFollowUpQuestion}
                      />
                    )}
                  {/* Suggested next questions: only under the finished latest
                      answer, and never persisted, so a reload clears them. */}
                  {isLast &&
                    !isOrganizationWelcome &&
                    !isSending &&
                    !statusMessage &&
                    onFollowUpQuestion &&
                    followUpQuestions.length > 0 && (
                      <div
                        role="group"
                        aria-label={t('actions.followUpQuestions')}
                        className="mt-3 flex flex-col items-start gap-1 animate-in fade-in duration-500"
                      >
                        {followUpQuestions.map((question: string) => (
                          <button
                            key={question}
                            type="button"
                            onClick={() => onFollowUpQuestion(question)}
                            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <ArrowDownRight
                              aria-hidden
                              className="size-4 shrink-0 opacity-60"
                            />
                            <span>{question}</span>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </MessageScrollerItem>
          );
        })}
      </MessageScrollerContent>
      {onAskAboutPassage ? (
        <PassageAskButton
          label={t('actions.askAboutPassage')}
          onAsk={onAskAboutPassage}
        />
      ) : null}
      {citationViewer ? (
        <React.Suspense fallback={null}>
          {citationViewer.kind === 'pdf' ? (
            <PdfViewer
              fileUrl={citationViewer.fileUrl}
              fileName={citationViewer.fileName}
              highlightedText={citationViewer.snippet}
              highlightPages={citationViewer.pages}
              initialPage={citationViewer.pages[0] ?? 1}
              onClose={() => setCitationViewer(null)}
            />
          ) : (
            <VideoViewer
              fileUrl={citationViewer.fileUrl}
              fileName={citationViewer.fileName}
              onClose={() => setCitationViewer(null)}
            />
          )}
        </React.Suspense>
      ) : null}
    </BlockLabelsProvider>
  );
}
