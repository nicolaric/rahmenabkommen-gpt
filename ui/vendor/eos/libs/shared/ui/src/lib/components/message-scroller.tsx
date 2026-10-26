import * as React from 'react';
import { ArrowDownIcon } from 'lucide-react';

import { cn } from '@eos/utils';

import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';

type MessageScrollerAnchor = {
  id: string;
  label: string;
  element: HTMLElement;
};

type MessageScrollerContextValue = {
  autoScroll: boolean;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  viewportHeight: number;
  canScrollToEnd: boolean;
  handleScroll: () => void;
  scrollToEnd: () => void;
  holdScrollPosition: () => void;
  anchors: MessageScrollerAnchor[];
  currentAnchorId: string | null;
  visibleMessageIds: string[];
  registerAnchor: (anchor: MessageScrollerAnchor) => () => void;
  scrollToAnchor: (id: string) => void;
  subscribeToVisibility: () => () => void;
};

const MessageScrollerContext =
  React.createContext<MessageScrollerContextValue | null>(null);

function useMessageScrollerContext() {
  const context = React.useContext(MessageScrollerContext);
  if (!context) {
    throw new Error(
      'MessageScroller components must be used within MessageScrollerProvider',
    );
  }
  return context;
}

function useMessageScroller() {
  return useMessageScrollerContext();
}

function MessageScrollerProvider({
  autoScroll = false,
  children,
}: React.PropsWithChildren<{ autoScroll?: boolean }>) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const isAtEndRef = React.useRef(true);
  const [canScrollToEnd, setCanScrollToEnd] = React.useState(false);
  // Consumers size their last turn from this so a freshly sent question can
  // always be scrolled to the top of the viewport: without a trailing item at
  // least as tall as the viewport there is simply no scroll room below it, and
  // the browser leaves the question wherever it already was.
  const [viewportHeight, setViewportHeight] = React.useState(0);
  // Timestamp until which stick-to-bottom stays disabled after a hold.
  const holdUntilRef = React.useRef(0);
  const anchorsRef = React.useRef(new Map<string, MessageScrollerAnchor>());
  const [anchors, setAnchors] = React.useState<MessageScrollerAnchor[]>([]);
  const [currentAnchorId, setCurrentAnchorId] = React.useState<string | null>(
    null,
  );
  const [visibleMessageIds, setVisibleMessageIds] = React.useState<string[]>(
    [],
  );
  // Reading position is measured on every scroll event, so it is only
  // computed while something actually renders it (the rail, a jump menu).
  const visibilitySubscribersRef = React.useRef(0);
  const isTrackingRef = React.useRef(false);

  const readAnchorsInDocumentOrder = React.useCallback(() => {
    return Array.from(anchorsRef.current.values()).sort((a, b) => {
      const position = a.element.compareDocumentPosition(b.element);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
  }, []);

  const updateVisibility = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const viewportRect = viewport.getBoundingClientRect();
    const nextVisible: string[] = [];
    for (const element of viewport.querySelectorAll<HTMLElement>(
      '[data-message-id]',
    )) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > viewportRect.top && rect.top < viewportRect.bottom) {
        const id = element.dataset['messageId'];
        if (id) nextVisible.push(id);
      }
    }
    setVisibleMessageIds((previous) =>
      previous.length === nextVisible.length &&
      previous.every((id, index) => id === nextVisible[index])
        ? previous
        : nextVisible,
    );

    // The active anchor is the last turn whose heading has passed the top
    // of the viewport, so it stays current after scrolling out of view.
    const ordered = readAnchorsInDocumentOrder();
    let nextAnchorId: string | null = null;
    for (const anchor of ordered) {
      const offset =
        anchor.element.getBoundingClientRect().top - viewportRect.top;
      if (offset <= 8) nextAnchorId = anchor.id;
      else break;
    }
    setCurrentAnchorId(nextAnchorId ?? ordered[0]?.id ?? null);
  }, [readAnchorsInDocumentOrder]);

  const updateScrollState = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const distanceToEnd =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const nextIsAtEnd = distanceToEnd < 32;
    // While a hold is active, do not re-arm stick-to-bottom. A smooth scroll
    // away from the end takes several frames, and the streaming answer mutates
    // the subtree on every chunk; without this the first mutation still sees
    // the viewport near the end, re-arms, and the next one snaps straight back
    // down - defeating the hold the caller just asked for.
    if (holdUntilRef.current <= performance.now()) {
      isAtEndRef.current = nextIsAtEnd;
    }
    setCanScrollToEnd(distanceToEnd > 64);

    if (isTrackingRef.current) updateVisibility();
  }, [updateVisibility]);

  const registerAnchor = React.useCallback(
    (anchor: MessageScrollerAnchor) => {
      anchorsRef.current.set(anchor.id, anchor);
      setAnchors(readAnchorsInDocumentOrder());

      return () => {
        anchorsRef.current.delete(anchor.id);
        setAnchors(readAnchorsInDocumentOrder());
      };
    },
    [readAnchorsInDocumentOrder],
  );

  const subscribeToVisibility = React.useCallback(() => {
    visibilitySubscribersRef.current += 1;
    isTrackingRef.current = true;
    updateVisibility();

    return () => {
      visibilitySubscribersRef.current -= 1;
      if (visibilitySubscribersRef.current <= 0) {
        visibilitySubscribersRef.current = 0;
        isTrackingRef.current = false;
      }
    };
  }, [updateVisibility]);

  const scrollToAnchor = React.useCallback((id: string) => {
    const viewport = viewportRef.current;
    const anchor = anchorsRef.current.get(id);
    if (!viewport || !anchor) return;

    const offset =
      anchor.element.getBoundingClientRect().top -
      viewport.getBoundingClientRect().top;
    isAtEndRef.current = false;
    viewport.scrollTo({
      top: viewport.scrollTop + offset - 8,
      behavior: 'smooth',
    });
  }, []);

  const scrollToEnd = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    isAtEndRef.current = true;
  }, []);

  // Stops the mutation-observer auto-scroll from fighting a just-triggered
  // scroll (e.g. bringing a new question to the top of the viewport) -
  // without this, the next streamed-in chunk snaps the viewport straight
  // back to the bottom before the smooth scroll can finish.
  const holdScrollPosition = React.useCallback(() => {
    isAtEndRef.current = false;
    holdUntilRef.current = performance.now() + 1200;
  }, []);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const measure = () => {
      // On mobile Swissmem lets the document own scrolling so Safari can
      // collapse its browser chrome. In that mode this element grows with its
      // content; using its clientHeight to size the last turn would create a
      // feedback loop and make the page endlessly tall.
      const isDocumentScroller =
        window.getComputedStyle(viewport).overflowY === 'visible';
      if (isDocumentScroller) {
        setViewportHeight(0);
        return;
      }

      // `overflow-y: auto` alone does not make this a real scroller: if no
      // ancestor bounds its height it still grows with its content, so
      // clientHeight would include the very turn we are about to size and the
      // ResizeObserver below would ratchet it up on every pass. Clamping to
      // the window keeps the reserved space at one screen, which is all the
      // last turn ever needs, and makes that runaway impossible regardless of
      // how the embedding page lays this out.
      setViewportHeight(Math.min(viewport.clientHeight, window.innerHeight));
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    // The clamp above reads window.innerHeight, which the observer alone would
    // not notice when the viewport itself keeps its size.
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Streaming text mutates the subtree for every chunk. Without
    // auto-scroll there is nothing to observe, and measuring layout for
    // each mutation can block the stream reader.
    if (!autoScroll) {
      updateScrollState();
      return;
    }

    const observer = new MutationObserver(() => {
      if (isAtEndRef.current) {
        viewport.scrollTop = viewport.scrollHeight;
      }
      updateScrollState();
    });

    observer.observe(viewport, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    updateScrollState();

    return () => observer.disconnect();
  }, [autoScroll, updateScrollState]);

  const value = React.useMemo(
    () => ({
      autoScroll,
      viewportRef,
      viewportHeight,
      canScrollToEnd,
      handleScroll: updateScrollState,
      scrollToEnd,
      holdScrollPosition,
      anchors,
      currentAnchorId,
      visibleMessageIds,
      registerAnchor,
      scrollToAnchor,
      subscribeToVisibility,
    }),
    [
      autoScroll,
      viewportHeight,
      canScrollToEnd,
      scrollToEnd,
      holdScrollPosition,
      updateScrollState,
      anchors,
      currentAnchorId,
      visibleMessageIds,
      registerAnchor,
      scrollToAnchor,
      subscribeToVisibility,
    ],
  );

  return (
    <MessageScrollerContext.Provider value={value}>
      {children}
    </MessageScrollerContext.Provider>
  );
}

function MessageScroller({ className, ...props }: React.ComponentProps<'div'>) {
  const { autoScroll, canScrollToEnd } = useMessageScrollerContext();

  return (
    <div
      data-slot="message-scroller"
      data-autoscroll={autoScroll ? 'true' : 'false'}
      data-scrollable-end={canScrollToEnd ? 'true' : 'false'}
      className={cn('relative flex min-h-0 min-w-0 flex-col', className)}
      {...props}
    />
  );
}

function MessageScrollerViewport({
  className,
  onScroll,
  ref,
  ...props
}: React.ComponentProps<'div'>) {
  const { viewportRef, handleScroll } = useMessageScrollerContext();

  return (
    <div
      ref={(node) => {
        viewportRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      data-slot="message-scroller-viewport"
      role="region"
      aria-label="Messages"
      tabIndex={0}
      className={cn(
        'min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain scroll-smooth outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        className,
      )}
      onScroll={(event) => {
        handleScroll();
        onScroll?.(event);
      }}
      {...props}
    />
  );
}

function MessageScrollerContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-scroller-content"
      role="log"
      aria-relevant="additions"
      className={cn('flex min-h-full min-w-0 w-full flex-col', className)}
      {...props}
    />
  );
}

function MessageScrollerItem({
  className,
  messageId,
  scrollAnchor,
  anchorLabel,
  ...props
}: React.ComponentProps<'div'> & {
  messageId?: string;
  scrollAnchor?: boolean;
  anchorLabel?: string;
}) {
  const { registerAnchor } = useMessageScrollerContext();
  const itemRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const element = itemRef.current;
    if (!element || !scrollAnchor || !messageId) return;

    return registerAnchor({
      id: messageId,
      label: (anchorLabel ?? element.textContent ?? '').trim().slice(0, 120),
      element,
    });
  }, [anchorLabel, messageId, registerAnchor, scrollAnchor]);

  return (
    <div
      ref={itemRef}
      data-slot="message-scroller-item"
      data-message-id={messageId}
      data-scroll-anchor={scrollAnchor ? 'true' : undefined}
      className={cn(
        '[content-visibility:auto] [contain-intrinsic-size:auto_160px]',
        className,
      )}
      {...props}
    />
  );
}

/* Subscribing turns on reading-position tracking for as long as a consumer is
   mounted - `currentAnchorId` answers "where am I" and stays set once that turn
   scrolls above the viewport, `visibleMessageIds` answers "what is on screen".*/
function useMessageScrollerVisibility() {
  const {
    anchors,
    currentAnchorId,
    visibleMessageIds,
    scrollToAnchor,
    subscribeToVisibility,
  } = useMessageScrollerContext();

  React.useEffect(() => subscribeToVisibility(), [subscribeToVisibility]);

  return { anchors, currentAnchorId, visibleMessageIds, scrollToAnchor };
}

function MessageScrollerRail({
  className,
  'aria-label': ariaLabel,
  ...props
}: React.ComponentProps<'nav'>) {
  const { anchors, currentAnchorId, scrollToAnchor } =
    useMessageScrollerVisibility();

  if (anchors.length < 2) return null;

  return (
    <nav
      data-slot="message-scroller-rail"
      aria-label={ariaLabel ?? 'Conversation outline'}
      className={cn(
        'absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 md:flex',
        className,
      )}
      {...props}
    >
      <HoverCard>
        <HoverCardTrigger asChild>
          <button
            type="button"
            aria-label="Open transcript outline"
            className="flex h-9 w-9 flex-col items-center justify-center gap-1 rounded-md transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {anchors.map((anchor) => (
              <span
                key={anchor.id}
                data-current={anchor.id === currentAnchorId ? 'true' : 'false'}
                className="h-0.5 w-4 rounded-full bg-muted-foreground/40 data-[current=true]:bg-foreground"
              />
            ))}
          </button>
        </HoverCardTrigger>
        <HoverCardContent
          side="left"
          className="flex w-64 flex-col gap-1 rounded-2xl p-1"
        >
          {anchors.map((anchor) => {
            const isCurrent = anchor.id === currentAnchorId;

            return (
              <button
                key={anchor.id}
                type="button"
                aria-current={isCurrent ? 'location' : undefined}
                className="flex min-h-7 items-center rounded-xl px-2 py-1.5 text-left text-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground aria-current:bg-accent aria-current:text-accent-foreground"
                onClick={() => scrollToAnchor(anchor.id)}
              >
                <span className="line-clamp-1 min-w-0">
                  {anchor.label || 'Conversation turn'}
                </span>
              </button>
            );
          })}
        </HoverCardContent>
      </HoverCard>
    </nav>
  );
}

function MessageScrollerButton({
  className,
  children,
  'aria-label': ariaLabel,
  ...props
}: React.ComponentProps<'button'>) {
  const { canScrollToEnd, scrollToEnd } = useMessageScrollerContext();

  return (
    <button
      type="button"
      data-slot="message-scroller-button"
      data-active={canScrollToEnd ? 'true' : 'false'}
      tabIndex={canScrollToEnd ? 0 : -1}
      aria-hidden={canScrollToEnd ? undefined : true}
      aria-label={ariaLabel ?? (children ? undefined : 'Scroll to end')}
      className={cn(
        'absolute bottom-4 left-1/2 z-10 inline-flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border bg-background/95 text-foreground shadow-sm backdrop-blur transition-all hover:bg-accent hover:text-accent-foreground',
        canScrollToEnd
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0',
        className,
      )}
      onClick={(event) => {
        scrollToEnd();
        props.onClick?.(event);
      }}
      {...props}
    >
      {children ?? <ArrowDownIcon className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}

export {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerRail,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerVisibility,
};
