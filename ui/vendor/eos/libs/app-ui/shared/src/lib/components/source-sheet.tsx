import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  lazy,
  Suspense,
} from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  useSidebar,
} from '@eos/shared/ui';
import { Card, CardContent, Badge } from '@eos/shared/ui';
import {
  FileText,
  ExternalLink,
  BookOpen,
  Download,
  Loader2,
  Globe,
  ImageIcon,
} from 'lucide-react';
import { BrainCitationBadge } from './brain-citation-badge';

const PdfViewer = lazy(() => import('./pdf-viewer'));
const VideoViewer = lazy(() => import('./video-viewer'));

type Source = {
  file_id?: string;
  snippet?: string | null;
  page_numbers?: number[];
  source?: string | null;
  source_url?: string | null;
  source_provider?: string | null;
  url?: string | null;
  file_type?: string | null;
  fileType?: string | null;
  // Image-specific fields
  content_type?: string;
  image_id?: string;
};

type ToolWebTrace = {
  kind: 'tool' | 'web';
  status: string;
  tool_name?: string | null;
  url?: string | null;
  request_preview?: string | null;
  response_preview?: string | null;
  content_type?: string | null;
  bytes?: number | null;
};

type FileMetadata = {
  name: string;
  file_type?: string | null; // now available from backend
  source_provider?: string | null;
  source_url?: string | null;
};

type BrainSource = {
  display_ref?: string | null;
  source_type?: string | null;
  evidence_kind?: string | null;
  entry_kind?: 'signal' | 'graph' | string | null;
  summary?: string | null;
  extracted_content?: string | null;
  signal_kind?: string | null;
  confidence?: number | null;
  origin?: string | null;
  signal_status?: string | null;
  applicability_conditions?: string[] | null;
  limitations?: string[] | null;
};

type SourcesModalProps = {
  sources: Source[];
  brainSources?: BrainSource[];
  toolWebTraces?: ToolWebTrace[];
  apiUrl: string;
  activeTeamId: string;
  activeWorkspaceId?: string;
  t: (key: string, options?: any) => string;
};

export function SourcesModal({
  sources = [],
  brainSources = [],
  toolWebTraces = [],
  apiUrl,
  activeTeamId,
  activeWorkspaceId,
  t,
}: SourcesModalProps) {
  const { isMobile } = useSidebar();
  const sheetTransitionClassName = isMobile
    ? 'data-[state=open]:animate-none data-[state=closed]:animate-none transition-transform transition-opacity data-[state=open]:translate-y-0 data-[state=closed]:translate-y-[104%] data-[state=open]:opacity-100 data-[state=closed]:opacity-100 data-[state=open]:duration-[820ms] data-[state=closed]:duration-[560ms] data-[state=open]:ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:ease-[cubic-bezier(0.32,0,0.67,0)]'
    : 'data-[state=open]:animate-none data-[state=closed]:animate-none transition-transform transition-opacity data-[state=open]:translate-x-0 data-[state=closed]:translate-x-[104%] data-[state=open]:opacity-100 data-[state=closed]:opacity-100 data-[state=open]:duration-[780ms] data-[state=closed]:duration-[520ms] data-[state=open]:ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:ease-[cubic-bezier(0.32,0,0.67,0)]';
  const sheetClassName = isMobile
    ? 'h-[85vh] max-h-[85vh] p-0 gap-0 will-change-transform data-[state=open]:duration-700 data-[state=closed]:duration-500'
    : 'w-[92vw] sm:max-w-2xl p-0 gap-0 will-change-transform data-[state=open]:duration-700 data-[state=closed]:duration-500';
  const [open, setOpen] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, FileMetadata>>({});
  const [loading, setLoading] = useState(false);

  const [viewingPdf, setViewingPdf] = useState<Source | null>(null);
  const [viewingVideo, setViewingVideo] = useState<Source | null>(null);

  const webTraces = useMemo(
    () => toolWebTraces.filter((trace) => trace.kind === 'web'),
    [toolWebTraces],
  );
  const toolTraces = useMemo(
    () => toolWebTraces.filter((trace) => trace.kind === 'tool'),
    [toolWebTraces],
  );

  const totalSources =
    sources.length + brainSources.length + toolWebTraces.length;

  const fileIds = useMemo(
    () =>
      sources.map((s) => s.file_id).filter((id): id is string => Boolean(id)),
    [sources],
  );

  const fetchedIdsRef = useRef(new Set<string>());

  const buildContextQuery = useCallback(() => {
    const searchParams = new URLSearchParams({ organizationId: activeTeamId });

    if (activeWorkspaceId) {
      searchParams.set('workspaceId', activeWorkspaceId);
    }

    return searchParams.toString();
  }, [activeTeamId, activeWorkspaceId]);

  const fetchMetadata = useCallback(async () => {
    const toFetch = fileIds.filter(
      (id) => !metadata[id] && !fetchedIdsRef.current.has(id),
    );
    if (toFetch.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/files/batch-metadata?${buildContextQuery()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_ids: toFetch }),
        },
      );

      if (!res.ok) throw new Error(`Metadata fetch failed: ${res.status}`);

      const data = await res.json();

      setMetadata((prev) => {
        const next = { ...prev };
        (data.files ?? []).forEach((item: any) => {
          if (item.file_id) {
            next[item.file_id] = {
              name: item.name ?? t('sourceDetails.unnamedFile'),
              file_type: item.file_type ?? item.fileType ?? item.content_type,
              source_provider: item.source_provider ?? item.sourceProvider,
              source_url: item.source_url ?? item.sourceUrl,
            };
          }
        });
        return next;
      });

      toFetch.forEach((id) => fetchedIdsRef.current.add(id));
    } catch (err) {
      console.error('Failed to load file metadata:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, buildContextQuery, fileIds, metadata, t]);

  useEffect(() => {
    if (open) fetchMetadata();
  }, [open, fetchMetadata]);

  const getFileInfo = (fileId?: string): FileMetadata => {
    if (fileId && metadata[fileId]) return metadata[fileId];
    return { name: t('sourceDetails.fileNotAvailable') };
  };

  const normalizeHttpUrl = (url?: string | null) => {
    const candidate = url?.trim();
    if (!candidate) return null;

    try {
      const parsed = new URL(candidate);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
        ? parsed.toString()
        : null;
    } catch {
      return null;
    }
  };

  const getSourceFileType = (source: Source) => {
    const meta = getFileInfo(source.file_id);
    return (
      meta.file_type ??
      source.file_type ??
      source.fileType ??
      ''
    ).toLowerCase();
  };

  const getSourceProvider = (source: Source) => {
    const meta = getFileInfo(source.file_id);
    return (meta.source_provider ?? source.source_provider ?? '').toLowerCase();
  };

  const getWebsiteUrl = (source: Source) => {
    const meta = getFileInfo(source.file_id);
    return (
      normalizeHttpUrl(meta.source_url) ??
      normalizeHttpUrl(source.source_url) ??
      normalizeHttpUrl(source.url) ??
      normalizeHttpUrl(source.source)
    );
  };

  const isWebsiteSource = (source: Source) => {
    const fileType = getSourceFileType(source);
    const provider = getSourceProvider(source);
    const websiteUrl = getWebsiteUrl(source);

    return (
      fileType === 'website' ||
      provider === 'website' ||
      Boolean(websiteUrl && normalizeHttpUrl(source.source) === websiteUrl)
    );
  };

  const isLikelyPdf = (source: Source) => {
    const meta = getFileInfo(source.file_id);
    const mime = getSourceFileType(source);

    if (mime) {
      return mime === 'application/pdf' || mime === 'pdf';
    }

    return (
      source.file_id?.toLowerCase().endsWith('.pdf') ||
      meta.name.toLowerCase().endsWith('.pdf')
    );
  };

  const isLikelyVideo = (source: Source) => {
    const meta = getFileInfo(source.file_id);
    const mime = getSourceFileType(source);

    if (mime) {
      return mime.startsWith('video/') || mime === 'video';
    }

    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.ogv'];
    const name = meta.name.toLowerCase();
    const id = source.file_id?.toLowerCase() ?? '';
    return videoExtensions.some(
      (ext) => name.endsWith(ext) || id.endsWith(ext),
    );
  };

  const handleAction = (source: Source) => {
    if (isWebsiteSource(source)) {
      const websiteUrl = getWebsiteUrl(source);
      if (websiteUrl) {
        window.open(websiteUrl, '_blank', 'noopener,noreferrer');
      }
    } else if (isLikelyPdf(source)) {
      setViewingPdf(source);
      // setOpen(false);   ← uncomment if you want modal to close when viewer opens
    } else if (isLikelyVideo(source)) {
      setViewingVideo(source);
      // setOpen(false);   ← uncomment if you want modal to close when viewer opens
    } else {
      const url = `${apiUrl}/files/${source.file_id}/download?${buildContextQuery()}`;
      const { name } = getFileInfo(source.file_id);

      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getStatusVariant = (status: string): 'default' | 'destructive' =>
    status === 'success' ? 'default' : 'destructive';

  const getStatusLabel = (status: string) =>
    t(`sourceDetails.status.${status}`, { defaultValue: status });

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background hover:bg-muted text-muted-foreground text-xs font-medium transition-all shadow-sm border-primary/20 hover:border-primary/50">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>
              {totalSources === 1
                ? t('sourcesOne')
                : t('sourcesOther', { count: totalSources })}
            </span>
          </button>
        </SheetTrigger>

        <SheetContent
          forceMount
          side={isMobile ? 'bottom' : 'right'}
          className={`${sheetClassName} ${sheetTransitionClassName}`}
        >
          <SheetHeader className="border-b p-6">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t('sourceDetails.title')}
            </SheetTitle>
            <SheetDescription>
              {t('sourceDetails.description')}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-4 no-scrollbar">
            {loading && Object.keys(metadata).length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4 pb-8">
                {brainSources.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 pt-1 pb-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('sourceDetails.brainSources')}
                      </span>
                    </div>
                    {brainSources.map((source, i) => {
                      const content =
                        source.extracted_content ||
                        source.summary ||
                        t('sourceDetails.brainSourceUnavailable');
                      const conditions = source.applicability_conditions ?? [];
                      const limitations = source.limitations ?? [];
                      const status = source.signal_status;

                      return (
                        <Card key={`${source.display_ref ?? 'brain'}-${i}`}>
                          <CardContent>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <BrainCitationBadge
                                    displayRef={source.display_ref}
                                    fallbackNumber={i + 1}
                                  />
                                  <span className="text-sm font-medium">
                                    {t('sourceDetails.unconfirmedSignal')}
                                  </span>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                  {content}
                                </p>
                              </div>
                              {typeof source.confidence === 'number' && (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 text-[10px]"
                                >
                                  {Math.round(source.confidence * 100)}%{' '}
                                  {t('sourceDetails.confidence')}
                                </Badge>
                              )}
                            </div>

                            {(source.signal_kind ||
                              source.origin ||
                              status) && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {source.signal_kind && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {t(`signalKinds.${source.signal_kind}`)}
                                  </Badge>
                                )}
                                {source.origin && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {source.origin}
                                  </Badge>
                                )}
                                {status && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {status}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {conditions.length > 0 && (
                              <div className="mt-3">
                                <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  {t('sourceDetails.applicability')}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {conditions.join(', ')}
                                </p>
                              </div>
                            )}

                            {limitations.length > 0 && (
                              <div className="mt-3">
                                <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  {t('sourceDetails.limitations')}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {limitations.join(', ')}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </section>
                )}

                {sources.map((source, i) => {
                  const { name } = getFileInfo(source.file_id);
                  const snippet = source.snippet ?? '';
                  const isWebsite = isWebsiteSource(source);
                  const websiteUrl = getWebsiteUrl(source);
                  const isPdf = isLikelyPdf(source);
                  const isVideo = isLikelyVideo(source);
                  const isImage = source.content_type === 'image';
                  const actionLabel = isWebsite
                    ? t('sourceDetails.openWebsite')
                    : isPdf || isVideo
                      ? t('sourceDetails.view')
                      : t('sourceDetails.download');
                  const imageUrl =
                    isImage && source.image_id
                      ? `${apiUrl}/files/${source.file_id}/images/${source.image_id}?${buildContextQuery()}`
                      : null;

                  return (
                    <Card key={`${source.file_id}-${i}`}>
                      <CardContent>
                        <div className="flex items-start justify-between mb-2 gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="truncate text-sm font-medium flex items-center gap-2">
                              {name}
                              {isImage && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  <ImageIcon className="h-3 w-3 mr-1" />
                                  Image
                                </Badge>
                              )}
                            </span>
                            {isWebsite && websiteUrl ? (
                              <a
                                href={websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 block truncate text-xs text-primary underline-offset-2 hover:underline"
                                title={websiteUrl}
                              >
                                {websiteUrl}
                              </a>
                            ) : null}
                          </div>
                          <button
                            onClick={() => handleAction(source)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors shrink-0"
                            title={actionLabel}
                            aria-label={actionLabel}
                          >
                            {isWebsite || isPdf || isVideo ? (
                              <ExternalLink className="h-4 w-4" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {isImage && imageUrl ? (
                          <div className="space-y-3">
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block relative group"
                            >
                              <img
                                src={imageUrl}
                                alt="Extracted from document"
                                className="w-full h-auto max-h-48 object-contain rounded border bg-muted"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded" />
                            </a>
                            <p className="text-sm text-muted-foreground italic line-clamp-2">
                              "{snippet}"
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic line-clamp-3">
                            "{snippet}"
                          </p>
                        )}

                        {source.page_numbers?.length ? (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {source.page_numbers.map((page) => (
                              <Badge
                                key={page}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {t('sourceDetails.page')} {page}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}

                {toolWebTraces.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 pt-4 pb-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('sourceDetails.toolsAndWeb')}
                      </span>
                    </div>
                    {webTraces.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-1">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {t('sourceDetails.webRequests')}
                          </span>
                        </div>
                        {webTraces.map((trace, i) => (
                          <Card key={`webfetch-${i}`}>
                            <CardContent>
                              <div className="flex items-center justify-between mb-3 gap-3">
                                <div className="min-w-0 flex-1">
                                  <div
                                    className="truncate text-sm font-medium"
                                    title={trace.url || undefined}
                                  >
                                    {trace.url || t('sourceDetails.webRequest')}
                                  </div>
                                </div>
                                <Badge
                                  variant={getStatusVariant(trace.status)}
                                  className="text-[10px] capitalize"
                                >
                                  {getStatusLabel(trace.status)}
                                </Badge>
                              </div>

                              {trace.request_preview && (
                                <div className="mb-3">
                                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {t('sourceDetails.requestPreview')}
                                  </div>
                                  <p className="text-sm text-muted-foreground break-words">
                                    {trace.request_preview}
                                  </p>
                                </div>
                              )}

                              {trace.response_preview && (
                                <div>
                                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {t('sourceDetails.responsePreview')}
                                  </div>
                                  <p className="text-sm text-muted-foreground break-words">
                                    {trace.response_preview}
                                  </p>
                                </div>
                              )}

                              {(trace.content_type || trace.bytes != null) && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {trace.content_type && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px]"
                                    >
                                      {trace.content_type}
                                    </Badge>
                                  )}
                                  {trace.bytes != null && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px]"
                                    >
                                      {trace.bytes.toLocaleString()} bytes
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {toolTraces.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2 pb-1">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {t('sourceDetails.toolRequests')}
                          </span>
                        </div>
                        {toolTraces.map((trace, i) => (
                          <Card key={`external-tool-${i}`}>
                            <CardContent>
                              <div className="flex items-center justify-between mb-3 gap-3">
                                <div className="min-w-0 flex-1">
                                  <div
                                    className="truncate text-sm font-medium"
                                    title={
                                      trace.url || trace.tool_name || undefined
                                    }
                                  >
                                    {trace.tool_name ||
                                      t('sourceDetails.unknownTool')}
                                  </div>
                                  {trace.url && (
                                    <div
                                      className="truncate text-xs text-muted-foreground mt-1"
                                      title={trace.url}
                                    >
                                      {trace.url}
                                    </div>
                                  )}
                                </div>
                                <Badge
                                  variant={getStatusVariant(trace.status)}
                                  className="text-[10px] capitalize"
                                >
                                  {getStatusLabel(trace.status)}
                                </Badge>
                              </div>

                              {trace.request_preview && (
                                <div className="mb-3">
                                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {t('sourceDetails.requestPreview')}
                                  </div>
                                  <p className="text-sm text-muted-foreground break-words">
                                    {trace.request_preview}
                                  </p>
                                </div>
                              )}

                              {trace.response_preview && (
                                <div>
                                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {t('sourceDetails.responsePreview')}
                                  </div>
                                  <p className="text-sm text-muted-foreground break-words">
                                    {trace.response_preview}
                                  </p>
                                </div>
                              )}

                              {trace.bytes != null && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {trace.bytes.toLocaleString()} bytes
                                  </Badge>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {viewingPdf && (
        <Suspense fallback={null}>
          <PdfViewer
            fileUrl={`${apiUrl}/files/${viewingPdf.file_id}/download?${buildContextQuery()}`}
            highlightedText={viewingPdf.snippet ?? undefined}
            highlightPages={viewingPdf.page_numbers}
            initialPage={viewingPdf.page_numbers?.[0] ?? 1}
            onClose={() => setViewingPdf(null)}
            fileName={getFileInfo(viewingPdf.file_id).name}
          />
        </Suspense>
      )}

      {viewingVideo && (
        <Suspense fallback={null}>
          <VideoViewer
            fileUrl={`${apiUrl}/files/${viewingVideo.file_id}/download?${buildContextQuery()}`}
            onClose={() => setViewingVideo(null)}
            fileName={
              (viewingVideo.file_id
                ? metadata[viewingVideo.file_id]?.name
                : undefined) ?? 'Video'
            }
          />
        </Suspense>
      )}
    </>
  );
}
