import {
  ConversationComponent,
  ConversationInput,
  openaiConversationStreamManager,
  useOpenAIConversationStream,
  getApiErrorMessage,
  type ConversationStreamMessage,
  quotePassage,
} from '@eos/app-ui/shared/client';
import { cancelConversationRequest } from '@eos/data-access/api';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@eos/shared/ui';
import { LoaderCircle, Share2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetcher } from 'react-router';
import { toast } from 'sonner';
import { Header } from '../lib/components/header';
import type { action as syncAction } from './action.sync-conversation';

const ORGANIZATION_ID = import.meta.env.VITE_YEOS_ORGANIZATION_ID as string;
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL as string;

export default function Index() {
  const { t } = useTranslation('common');
  const { t: tConversation } = useTranslation('conversation');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ConversationStreamMessage[]>([]);
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(
    null,
  );
  const [quotedPassage, setQuotedPassage] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamState = useOpenAIConversationStream(conversationId ?? '');
  const syncFetcher = useFetcher<typeof syncAction>();
  const shareFetcher = useFetcher<typeof syncAction>();

  const isStreaming = Boolean(streamState?.isStreaming);
  const sharedId =
    shareFetcher.data && 'id' in shareFetcher.data
      ? shareFetcher.data.id
      : null;
  const shareUrl = sharedId ? `${FRONTEND_URL}/conversations/${sharedId}` : '';

  const resetConversation = useCallback(() => {
    setConversationId(null);
    setMessage('');
    setIsSending(false);
    setMessages([]);
    setScrollToMessageId(null);
    setQuotedPassage(null);
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const streamMessage = streamState?.message;
    if (!streamMessage) return;

    setMessages((prev) => {
      const index = prev.findIndex((msg) => msg.id === streamMessage.id);
      if (index === -1) return [...prev, streamMessage];
      if (prev[index] === streamMessage) return prev;
      const next = [...prev];
      next[index] = streamMessage;
      return next;
    });
  }, [streamState?.message]);

  // Store every finished answer for the stats page and later sharing
  const wasStreamingRef = useRef(false);
  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming && conversationId) {
      syncFetcher.submit(
        { conversationId },
        { method: 'post', action: '/action/sync-conversation' },
      );
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, conversationId, syncFetcher]);

  useEffect(() => {
    if (shareFetcher.state !== 'idle' || !shareFetcher.data) return;
    if ('id' in shareFetcher.data) {
      setShareDialogOpen(true);
    } else {
      toast.error(t('share.error'));
    }
  }, [shareFetcher.state, shareFetcher.data, t]);

  const sendQuestion = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (isSending || !question) return;

    const requestId = crypto.randomUUID();
    setMessage('');
    setIsSending(true);
    setScrollToMessageId(requestId);
    setMessages((prev) => [
      ...prev,
      {
        id: requestId,
        question,
        answer: '',
        timestamp: new Date().toISOString(),
        sources: [],
        citations: [],
        tool_web_traces: [],
        rating: null,
        agent_id: null,
        agent_name: null,
      },
    ]);

    try {
      const serverConversationId = await openaiConversationStreamManager.start({
        conversationId: conversationId ?? undefined,
        organizationId: ORGANIZATION_ID,
        requestId,
        initialQuestion: question,
        requireDocumentSources: true,
      });

      if (!serverConversationId) {
        throw new Error('Failed to create conversation');
      }
      setConversationId(serverConversationId);
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== requestId));
      setScrollToMessageId((current) =>
        current === requestId ? null : current,
      );
      toast.error(
        getApiErrorMessage(error, tConversation('messageCouldNotBeSent')),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleAskAboutPassage = (passage: string) => {
    setQuotedPassage(passage);
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    });
  };

  const handleSendMessage = () => {
    if (isSending || !message.trim()) return;
    // A quoted passage travels as a Markdown quote above the question.
    const question = quotedPassage
      ? `${quotePassage(quotedPassage)}${message}`
      : message;
    setQuotedPassage(null);
    sendQuestion(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // While an answer streams, the send button turns into a stop button
  const handleCancel = async () => {
    if (!conversationId || !streamState?.requestId || streamState.isCancelling)
      return;
    openaiConversationStreamManager.setCancelling(conversationId, true);
    try {
      await cancelConversationRequest(streamState.requestId, ORGANIZATION_ID);
      openaiConversationStreamManager.cancel(conversationId);
    } catch (error) {
      toast.error(getApiErrorMessage(error, tConversation('cancelFailed')));
      openaiConversationStreamManager.setCancelling(conversationId, false);
    }
  };

  const handleShare = () => {
    if (!conversationId) return;
    shareFetcher.submit(
      { conversationId, intent: 'share' },
      { method: 'post', action: '/action/sync-conversation' },
    );
  };

  const input = (
    <ConversationInput
      ref={textareaRef}
      quote={quotedPassage}
      onRemoveQuote={() => setQuotedPassage(null)}
      message={message}
      setMessage={setMessage}
      handleSendMessage={handleSendMessage}
      isButtonLoading={isSending}
      isGenerating={isStreaming}
      isCancelling={Boolean(streamState?.isCancelling)}
      handleCancel={handleCancel}
      onKeyDown={handleKeyDown}
      placeholder={t('askYourQuestion')}
      className="mx-auto max-w-2xl"
    />
  );

  if (messages.length === 0) {
    return (
      <>
        <Header hideLogo />
        <main
          data-chat-page="conversation"
          className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 pb-24"
        >
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-3 lg:gap-5">
              <img
                src="/logo-colored.webp"
                alt=""
                className="size-10 lg:size-14"
              />
              <h1 className="text-2xl font-medium whitespace-nowrap min-[400px]:text-3xl sm:text-5xl lg:text-6xl">
                {t('appName')}
              </h1>
            </div>
            <p className="text-base text-balance text-muted-foreground md:text-xl">
              {t('intro')}
            </p>
          </div>
          <div className="w-full">{input}</div>
          <p className="text-center text-sm text-muted-foreground">
            {t('disclaimer')}
          </p>
          <a
            href="https://yeos.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {t('poweredBy')}
            <img src="https://yeos.ai/img/logo-short.svg" alt="" className="size-4" />
            yeos.ai
          </a>
        </main>
      </>
    );
  }

  return (
    <>
      <Header onNavigateHome={resetConversation}>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('share.button')}
          disabled={!conversationId || isStreaming || shareFetcher.state !== 'idle'}
          onClick={handleShare}
        >
          {shareFetcher.state !== 'idle' ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Share2 />
          )}
        </Button>
      </Header>
      <div
        data-chat-page="conversation"
        className="flex min-h-[calc(100svh-3.5rem)] min-w-0 flex-col sm:h-[calc(100dvh-3.5rem)] sm:min-h-0"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <MessageScrollerProvider>
            <MessageScroller className="flex-1">
              <MessageScrollerViewport>
                <div className="mx-auto w-full max-w-3xl px-2 py-6 pb-28 sm:px-4">
                  <ConversationComponent
                    messages={messages}
                    scrollToMessageId={scrollToMessageId}
                    hideWorkingStatus
                    statusMessage={streamState?.statusMessage}
                    statusTimings={streamState?.statusTimings}
                    activeTeamId={ORGANIZATION_ID}
                    isSending={isSending || isStreaming}
                    traceEventsByMessageId={
                      streamState?.traceEventsByMessageId ?? {}
                    }
                    outputBlocksByMessageId={
                      streamState?.outputBlocksByMessageId ?? {}
                    }
                    disableEdit
                    followUpQuestions={streamState?.followUpQuestions ?? []}
                    clarificationQuestions={
                      streamState?.clarificationQuestions ?? []
                    }
                    onFollowUpQuestion={sendQuestion}
                    onAskAboutPassage={handleAskAboutPassage}
                  />
                </div>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>
        <div
          data-mobile-composer
          className="sticky bottom-0 z-20 shrink-0 border-t border-border bg-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur"
        >
          {input}
        </div>
      </div>
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('share.title')}</DialogTitle>
            <DialogDescription>{t('share.description')}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border border-border p-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
            />
            <Button
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                toast.success(t('share.copied'));
              }}
            >
              {t('share.copy')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
