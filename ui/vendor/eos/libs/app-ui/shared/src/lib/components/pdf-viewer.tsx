import { Button } from '@eos/shared/ui';
import { Download, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { findChunkHighlights, type PageHighlights } from './pdf-highlight';
import './pdf-viewer.css';

// Keep the worker version aligned with react-pdf's exact pdfjs-dist dependency
// (5.4.296); a mismatched worker fails to render documents at runtime.
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Belt and braces: this pdfjs line is past the CVE-2024-4367 fix, but a
// document still has no business evaluating script in the app origin.
const DOCUMENT_OPTIONS = { isEvalSupported: false } as const;

// Horizontal padding of the scroll area and vertical padding around a page.
const PAGE_GUTTER_X = 32;
const PAGE_GUTTER_Y = 16;

type PdfViewerProps = {
    fileUrl: string;
    onClose: () => void;
    initialPage?: number;
    /** Text of the cited chunk; it is marked yellow where it appears. */
    highlightedText?: string;
    /** Pages the chunk is on, in order; without them every page is searched. */
    highlightPages?: number[];
    fileName: string;
};

export default function PdfViewer({
    fileUrl,
    onClose,
    initialPage,
    highlightedText = '',
    highlightPages,
    fileName,
}: PdfViewerProps) {
    const [pageCount, setPageCount] = useState(0);
    const [viewport, setViewport] = useState<{
        width: number;
        height: number;
    }>();
    // Width ÷ height of the document's first page; A4 portrait until known.
    const [pageAspect, setPageAspect] = useState(1 / Math.SQRT2);
    const [pageTexts, setPageTexts] = useState<Map<number, string[]>>(
        () => new Map(),
    );
    const scrollRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const scrolledToHighlight = useRef(false);

    const chunkPages = useMemo(
        () => (highlightPages ?? []).filter((page) => page > 0),
        [highlightPages],
    );

    // Highlights per page, recomputed as each page's text arrives.
    const highlights = useMemo(() => {
        const result = new Map<number, PageHighlights>();
        if (!highlightedText.trim()) return result;
        for (const [pageNumber, items] of pageTexts) {
            const position = chunkPages.indexOf(pageNumber);
            if (chunkPages.length && position === -1) continue;
            const found = findChunkHighlights(
                items,
                highlightedText,
                chunkPages.length
                    ? {
                          first: position === 0,
                          last: position === chunkPages.length - 1,
                      }
                    : { first: true, last: true },
            );
            if (found.size) result.set(pageNumber, found);
        }
        return result;
    }, [chunkPages, highlightedText, pageTexts]);

    // Once the first highlight is in the text layer, centre it on screen.
    useEffect(() => {
        if (scrolledToHighlight.current || !highlights.size) return;
        const handle = window.setTimeout(() => {
            const mark = scrollRef.current?.querySelector(
                'mark.pdf-chunk-highlight',
            );
            if (!mark) return;
            scrolledToHighlight.current = true;
            mark.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 150);
        return () => window.clearTimeout(handle);
    }, [highlights]);

    // Viewer size, tracked so pages rescale with the window.
    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const observer = new ResizeObserver(([entry]) => {
            setViewport({
                width: entry.contentRect.width,
                height: entry.contentRect.height,
            });
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    // Whole-page fit: as wide as the viewer allows, but never taller than it,
    // so on a desktop screen one full page is visible at a time. On narrow
    // screens the width is the limit, as before.
    const width = viewport
        ? Math.max(
              0,
              Math.floor(
                  Math.min(
                      viewport.width - PAGE_GUTTER_X,
                      (viewport.height - PAGE_GUTTER_Y) * pageAspect,
                  ),
              ),
          )
        : undefined;

    const onLoadSuccess = useCallback(
        (pdf: {
            numPages: number;
            getPage: (pageNumber: number) => Promise<{
                getViewport: (options: { scale: number }) => {
                    width: number;
                    height: number;
                };
            }>;
        }) => {
            setPageCount(pdf.numPages);
            pdf.getPage(1)
                .then((page) => {
                    const { width, height } = page.getViewport({ scale: 1 });
                    if (width > 0 && height > 0) setPageAspect(width / height);
                })
                .catch(() => {
                    // Keep the A4 default; the pages still render.
                });
        },
        [],
    );

    // Jump to the cited page once its canvas exists.
    useEffect(() => {
        if (!pageCount || !initialPage || initialPage < 2) return;
        pageRefs.current
            .get(initialPage)
            ?.scrollIntoView({ block: 'start', behavior: 'auto' });
    }, [pageCount, initialPage]);

    return createPortal(
        <div
            data-conversation-keyboard-nav-disabled="true"
            className="fixed inset-0 z-[100] bg-slate-900 flex flex-col h-dvh"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0">
                <span className="font-medium">{fileName}</span>
                <div className="flex items-center gap-2">
                    <Button asChild size="icon" variant="outline">
                        <a href={fileUrl} download={fileName}>
                            <Download />
                        </a>
                    </Button>
                    <Button onClick={onClose} size="icon" variant="outline">
                        <X />
                    </Button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="min-h-0 flex-1 bg-slate-100 overflow-auto px-4"
            >
                <Document
                    file={fileUrl}
                    options={DOCUMENT_OPTIONS}
                    onLoadSuccess={onLoadSuccess}
                    loading={null}
                    error={
                        <p className="p-4 text-sm text-slate-600">
                            This document could not be displayed.
                        </p>
                    }
                >
                    {Array.from({ length: pageCount }, (_, index) => {
                        const pageNumber = index + 1;
                        return (
                            <div
                                key={pageNumber}
                                ref={(node) => {
                                    if (node) {
                                        pageRefs.current.set(pageNumber, node);
                                    } else {
                                        pageRefs.current.delete(pageNumber);
                                    }
                                }}
                                className="flex justify-center py-2"
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    width={width}
                                    className="shadow-sm"
                                    onGetTextSuccess={
                                        highlightedText
                                            ? ({ items }) =>
                                                  setPageTexts((previous) =>
                                                      new Map(previous).set(
                                                          pageNumber,
                                                          items.map((item) =>
                                                              'str' in item
                                                                  ? item.str
                                                                  : '',
                                                          ),
                                                      ),
                                                  )
                                            : undefined
                                    }
                                    customTextRenderer={
                                        highlights.has(pageNumber)
                                            ? ({ str, itemIndex }) =>
                                                  highlightRange(
                                                      str,
                                                      highlights
                                                          .get(pageNumber)
                                                          ?.get(itemIndex),
                                                  )
                                            : undefined
                                    }
                                />
                            </div>
                        );
                    })}
                </Document>
            </div>
        </div>,
        document.body,
    );
}

/**
 * Wrap the cited part of one text item in a <mark>.
 *
 * `customTextRenderer` returns an HTML string that react-pdf injects into the
 * text layer, so the text is escaped before any markup is added.
 */
function highlightRange(str: string, range?: [number, number]): string {
    if (!range) return escapeHtml(str);
    const [start, end] = range;
    return (
        escapeHtml(str.slice(0, start)) +
        `<mark class="pdf-chunk-highlight">${escapeHtml(str.slice(start, end))}</mark>` +
        escapeHtml(str.slice(end))
    );
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
