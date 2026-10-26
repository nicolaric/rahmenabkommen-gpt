import {
  streamChatCompletion,
  type ChatCompletionChunk,
} from '@eos/data-access/api';
import type {
  ClarificationQuestion,
  ConversationAttachment,
  ConversationDocumentContext,
  Message,
} from '@eos/data-access/api';

export type StreamTimings = {
  time_to_first_chunk?: number | null;
  time_to_first_token?: number | null;
  response_time?: number | null;
};

export type StreamTraceEvent = {
  type: string;
  [key: string]: unknown;
};

export type ConversationStreamMessage = Message & {
  agent_id: string | null;
  agent_name: string | null;
};

export type ConversationOutputBlock =
  | { type: 'text'; id: string; text: string }
  | {
      type: 'tool_call';
      id: string;
      name: string;
      status: 'pending' | 'running' | 'completed' | 'failed';
      args?: unknown;
      result?: unknown;
      summary?: string;
      toolCallIndex?: number;
    };

export type ResearchSuggestion = {
  trigger_type: 'context_entry' | 'document';
  trigger_id: string;
  question: string;
  objective: string;
  explanation: string;
};

export type OpenAIConversationStreamState = {
  conversationId: string;
  organizationId: string;
  workspaceId?: string;
  requestId: string;
  replaceMessageId?: string;
  messageId?: string;
  isStreaming: boolean;
  isCancelling: boolean;
  statusKey: string | null;
  statusMessage: string | null;
  statusTimings: StreamTimings | null;
  message: ConversationStreamMessage | null;
  outputBlocksByMessageId: Record<string, ConversationOutputBlock[]>;
  traceEventsByMessageId: Record<string, StreamTraceEvent[]>;
  completedAt: number | null;
  preview: string | null;
  unread: boolean;
  error: string | null;
  title: string | null;
  serverConversationId: string | null;
  researchSuggestion: ResearchSuggestion | null;
  /** Suggested next questions for this answer; never persisted. */
  followUpQuestions: string[];
  /** Multiple-choice questions the agent asked back; never persisted. */
  clarificationQuestions: ClarificationQuestion[];
};

export type OpenAIConversationStreamActivity = Pick<
  OpenAIConversationStreamState,
  | 'conversationId'
  | 'organizationId'
  | 'workspaceId'
  | 'completedAt'
  | 'preview'
  | 'unread'
  | 'title'
>;

type StartStreamOptions = {
  conversationId?: string;
  organizationId: string;
  workspaceId?: string;
  requestId: string;
  replaceMessageId?: string;
  initialQuestion?: string;
  reconnect?: boolean;
  model?: string;
  templateId?: string | null;
  documentContext?: ConversationDocumentContext | null;
  requireDocumentSources?: boolean;
  /** Draft attachments sent with the question; shown on it right away. */
  attachments?: ConversationAttachment[];
};

const STREAM_STATUS_KEYS: Record<string, string> = {
  preparing: 'state.preparing',
  planning: 'state.planning',
  selecting_agent: 'state.selecting_agent',
  retrieving: 'state.retrieving',
  retrieved: 'state.retrieved',
  checking_context: 'state.checking_context',
  generating: 'state.generating',
  waiting_clarification: 'state.waiting_clarification',
  no_results: 'state.no_results',
  condensing: 'state.condensing',
  regenerating: 'state.regenerating',
};

type Listener = () => void;

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 1_000;
const RENDER_YIELD_INTERVAL_MS = 8;

export class OpenAIConversationStreamManager {
  private streams = new Map<string, OpenAIConversationStreamState>();
  private snapshot = new Map<string, OpenAIConversationStreamState>();
  private activitySnapshot = new Map<
    string,
    OpenAIConversationStreamActivity
  >();
  private abortControllers = new Map<string, AbortController>();
  private reconnectAttempts = new Map<string, number>();
  private listeners = new Set<Listener>();
  private activityListeners = new Set<Listener>();
  private batchDepth = 0;
  private hasPendingEmit = false;
  private hasPendingActivityEmit = false;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot() {
    return this.snapshot;
  }

  subscribeActivity(listener: Listener) {
    this.activityListeners.add(listener);
    return () => this.activityListeners.delete(listener);
  }

  getActivitySnapshot() {
    return this.activitySnapshot;
  }

  getStream(conversationId: string) {
    return this.streams.get(conversationId) ?? null;
  }

  start(options: StartStreamOptions): Promise<string | undefined> {
    const streamKey = options.conversationId ?? `new-${options.requestId}`;
    const existing = this.streams.get(streamKey);
    if (existing?.requestId === options.requestId && existing.isStreaming) {
      return Promise.resolve(existing.serverConversationId ?? undefined);
    }

    // If a stream exists under a different key for the same request, clean it up
    this.abortControllers.get(streamKey)?.abort();
    for (const [key, state] of this.streams) {
      if (state.requestId === options.requestId && key !== streamKey) {
        this.abortControllers.get(key)?.abort();
        this.streams.delete(key);
      }
    }

    const targetMessageId = options.replaceMessageId ?? options.requestId;
    const optimisticMessage = options.initialQuestion
      ? {
          id: targetMessageId,
          question: options.initialQuestion,
          answer: '',
          timestamp: new Date().toISOString(),
          sources: [],
          citations: [],
          document_context:
            options.documentContext?.scope === 'selected' ||
            options.documentContext?.scope === 'tagged'
              ? options.documentContext
              : null,
          attachments: options.attachments ?? [],
          brain_citations: [],
          tool_web_traces: [],
          generated_attachments: [],
          suggested_actions: [],
          rating: null,
          agent_id: null,
          agent_name: null,
        }
      : null;

    const state: OpenAIConversationStreamState = {
      conversationId: streamKey,
      organizationId: options.organizationId,
      workspaceId: options.workspaceId,
      requestId: options.requestId,
      replaceMessageId: options.replaceMessageId,
      messageId: undefined,
      isStreaming: true,
      isCancelling: false,
      statusKey: null,
      statusMessage: null,
      statusTimings: null,
      message: optimisticMessage ?? existing?.message ?? null,
      outputBlocksByMessageId: existing?.outputBlocksByMessageId ?? {},
      traceEventsByMessageId: existing?.traceEventsByMessageId ?? {},
      completedAt: null,
      preview: null,
      unread: false,
      error: null,
      title: null,
      serverConversationId: null,
      researchSuggestion: null,
      followUpQuestions: [],
      clarificationQuestions: [],
    };
    this.streams.set(streamKey, state);
    this.emitNow();

    const abortController = new AbortController();
    this.abortControllers.set(streamKey, abortController);

    const messages =
      options.initialQuestion && !options.reconnect
        ? [{ role: 'user' as const, content: options.initialQuestion }]
        : [];

    return new Promise<string | undefined>((resolve, reject) => {
      let serverConversationId: string | null = null;
      let resolved = false;

      (async () => {
        try {
          const stream = streamChatCompletion(
            {
              model: options.model ?? 'yeos',
              messages,
              stream: true,
              conversation_id: options.conversationId,
              request_id: options.reconnect ? options.requestId : undefined,
              workspaceId: options.workspaceId,
              templateId: options.templateId,
              document_context: options.documentContext,
              require_document_sources: options.requireDocumentSources,
              // A reconnect resumes the running answer; the attachments were
              // already sent with the original request.
              attachment_ids:
                !options.reconnect && options.attachments?.length
                  ? options.attachments.map((attachment) => attachment.id)
                  : undefined,
            },
            options.organizationId,
            undefined,
            { workspaceId: options.workspaceId },
          );

          let lastRenderYieldAt = getMonotonicTime();
          for await (const chunk of stream) {
            if (abortController.signal.aborted) break;

            this.reconnectAttempts.delete(serverConversationId ?? streamKey);

            if (chunk.conversation_id && !serverConversationId) {
              serverConversationId = chunk.conversation_id;
              // Rekey from temp key to real conversationId
              if (streamKey !== serverConversationId) {
                const currentState = this.streams.get(streamKey);
                if (currentState) {
                  currentState.conversationId = serverConversationId;
                  currentState.serverConversationId = serverConversationId;
                  this.streams.set(serverConversationId, currentState);
                  this.streams.delete(streamKey);
                  this.abortControllers.set(
                    serverConversationId,
                    abortController,
                  );
                  this.abortControllers.delete(streamKey);
                  this.emitNow();
                }
              }
              if (!resolved) {
                resolved = true;
                resolve(serverConversationId);
              }
            }

            this.handleChunk(
              serverConversationId ?? streamKey,
              options.requestId,
              chunk,
            );

            // An SSE reader can yield a burst of events through microtasks.
            // Yield periodically so React and the browser can paint the
            // updated response rather than appearing frozen until the stream
            // finishes.
            if (
              getMonotonicTime() - lastRenderYieldAt >=
              RENDER_YIELD_INTERVAL_MS
            ) {
              await yieldToBrowser();
              lastRenderYieldAt = getMonotonicTime();
            }
          }

          const finishedConversationId = serverConversationId ?? streamKey;
          if (abortController.signal.aborted) {
            this.finish(finishedConversationId, options.requestId, {
              isStreaming: false,
              isCancelling: false,
            });
          } else {
            // Some SSE proxies close the stream without forwarding the final
            // finish_reason chunk. Always finalize a normally closed stream
            // so the response controls are not left in a loading state.
            this.finish(finishedConversationId, options.requestId, {
              isStreaming: false,
              isCancelling: false,
              completedAt: Date.now(),
              preview: createPreview(
                this.streams.get(finishedConversationId)?.message?.answer,
              ),
              unread: true,
              statusKey: null,
              statusMessage: null,
            });
          }

          if (!resolved) {
            resolved = true;
            resolve(serverConversationId ?? undefined);
          }
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            this.finish(serverConversationId ?? streamKey, options.requestId, {
              isStreaming: false,
              isCancelling: false,
            });
            if (!resolved) {
              resolved = true;
              resolve(serverConversationId ?? undefined);
            }
            return;
          }
          console.error('OpenAI stream error:', error);

          const retryKey = serverConversationId ?? streamKey;

          // A rejected request (plan limit, permissions, bad payload) will be
          // rejected again on every retry, so surface it to the caller instead
          // of burning the reconnect budget and resolving as if nothing
          // happened - that is what turned a 402 into a generic failure.
          const status = (error as { status?: number }).status;
          if (typeof status === 'number' && status >= 400 && status < 500) {
            this.reconnectAttempts.delete(retryKey);
            this.update(retryKey, (current) => ({
              ...current,
              isStreaming: false,
              isCancelling: false,
              error: (error as Error).message || 'requestRejected',
            }));
            if (!resolved) {
              resolved = true;
              reject(error);
            }
            return;
          }

          const attempts = this.reconnectAttempts.get(retryKey) ?? 0;
          if (attempts < MAX_RECONNECT_ATTEMPTS) {
            this.reconnectAttempts.set(retryKey, attempts + 1);
            this.update(retryKey, (current) => ({
              ...current,
              error: 'reconnecting',
            }));
            if (!resolved) {
              resolved = true;
              resolve(serverConversationId ?? undefined);
            }
            setTimeout(
              () => {
                this.start({
                  ...options,
                  conversationId:
                    serverConversationId ?? options.conversationId,
                  reconnect: true,
                });
              },
              RECONNECT_DELAY_MS * (attempts + 1),
            );
            return;
          }

          this.reconnectAttempts.delete(retryKey);
          this.update(retryKey, (current) => ({
            ...current,
            isStreaming: false,
            isCancelling: false,
            error: (error as Error).message || 'connectionLost',
          }));
          if (!resolved) {
            resolved = true;
            resolve(undefined);
          }
        } finally {
          this.abortControllers.delete(serverConversationId ?? streamKey);
        }
      })();
    });
  }

  setCancelling(conversationId: string, isCancelling: boolean) {
    this.update(conversationId, (current) =>
      current.isCancelling === isCancelling
        ? current
        : { ...current, isCancelling },
    );
  }

  cancel(conversationId: string) {
    this.abortControllers.get(conversationId)?.abort();
    this.reconnectAttempts.delete(conversationId);
  }

  markRead(conversationId: string) {
    this.update(conversationId, (current) =>
      current.unread ? { ...current, unread: false } : current,
    );
  }

  clear(conversationId: string) {
    this.abortControllers.get(conversationId)?.abort();
    this.abortControllers.delete(conversationId);
    this.reconnectAttempts.delete(conversationId);
    this.streams.delete(conversationId);
    this.emitNow();
  }

  private handleChunk(
    conversationId: string,
    requestId: string,
    chunk: ChatCompletionChunk,
  ) {
    this.beginBatch();
    try {
      const current = this.streams.get(conversationId);
      if (!current || current.requestId !== requestId) return;

      const targetMessageId =
        choiceMessageId(chunk) ??
        current.messageId ??
        current.replaceMessageId ??
        current.requestId;
      if (chunk.conversation_id && !current.serverConversationId) {
        this.update(conversationId, (state) => ({
          ...state,
          serverConversationId: chunk.conversation_id ?? null,
        }));
      }

      const choice = chunk.choices[0];
      if (!choice) return;

      const delta = choice.delta;
      const persistedMessageId = delta.message_id;
      if (persistedMessageId) {
        this.update(conversationId, (state) => ({
          ...state,
          messageId: persistedMessageId,
          message: state.message
            ? { ...state.message, id: persistedMessageId }
            : state.message,
        }));
      }

      if (
        !current.message &&
        (delta.role ||
          delta.content ||
          delta.block_id ||
          delta.tool_calls?.length ||
          delta.trace_events?.length ||
          delta.brain_citations?.length ||
          delta.research_suggestion)
      ) {
        this.update(conversationId, (state) => ({
          ...state,
          message: {
            id: targetMessageId,
            question: state.message?.question ?? '',
            answer: '',
            timestamp: new Date().toISOString(),
            sources: [],
            citations: [],
            document_context: state.message?.document_context ?? null,
            attachments: state.message?.attachments,
            brain_citations: [],
            tool_web_traces: [],
            generated_attachments: [],
            suggested_actions: [],
            rating: null,
            agent_id: null,
            agent_name: null,
          },
          outputBlocksByMessageId: {
            ...state.outputBlocksByMessageId,
            [targetMessageId]:
              state.outputBlocksByMessageId[targetMessageId] ?? [],
          },
          traceEventsByMessageId: {
            ...state.traceEventsByMessageId,
            [targetMessageId]:
              state.traceEventsByMessageId[targetMessageId] ?? [],
          },
        }));
      }

      if (delta.research_suggestion) {
        const suggestion =
          delta.research_suggestion as Partial<ResearchSuggestion>;
        if (
          suggestion.trigger_type &&
          suggestion.trigger_id &&
          suggestion.question &&
          suggestion.objective
        ) {
          this.update(conversationId, (state) => ({
            ...state,
            researchSuggestion: suggestion as ResearchSuggestion,
          }));
        }
      }

      if (delta.follow_up_questions?.length) {
        const followUpQuestions = delta.follow_up_questions;
        this.update(conversationId, (state) => ({
          ...state,
          followUpQuestions,
        }));
      }

      if (delta.clarification_form?.questions.length) {
        const clarificationQuestions = delta.clarification_form.questions;
        this.update(conversationId, (state) => ({
          ...state,
          clarificationQuestions,
        }));
      }

      if (delta.title) {
        this.update(conversationId, (state) => ({
          ...state,
          title: delta.title ?? null,
        }));
      }

      if (
        delta.sources ||
        delta.citations ||
        delta.brain_citations ||
        delta.tool_web_traces ||
        delta.generated_attachments ||
        delta.document_context ||
        delta.suggested_actions
      ) {
        this.updateMessage(conversationId, (message) => ({
          ...message,
          sources:
            (delta.sources as Message['sources'] | undefined) ??
            message.sources,
          citations:
            (delta.citations as Message['citations'] | undefined) ??
            message.citations,
          brain_citations:
            (delta.brain_citations as Message['brain_citations'] | undefined) ??
            message.brain_citations,
          tool_web_traces:
            (delta.tool_web_traces as Message['tool_web_traces'] | undefined) ??
            message.tool_web_traces,
          generated_attachments:
            (delta.generated_attachments as
              | Message['generated_attachments']
              | undefined) ?? message.generated_attachments,
          document_context:
            (delta.document_context as
              | Message['document_context']
              | undefined) ?? message.document_context,
          suggested_actions:
            (delta.suggested_actions as
              | Message['suggested_actions']
              | undefined) ?? message.suggested_actions,
        }));
      }

      if (delta.trace_events && delta.trace_events.length > 0) {
        for (const traceEvent of delta.trace_events) {
          this.handleTraceEvent(conversationId, targetMessageId, traceEvent);
        }
      }

      if (typeof delta.reasoning_content === 'string') {
        this.handleTraceEvent(conversationId, targetMessageId, {
          type: 'reasoning',
          content: delta.reasoning_content,
        });
      }

      if (delta.tool_calls && delta.tool_calls.length > 0) {
        for (const toolCall of delta.tool_calls) {
          this.handleToolCall(
            conversationId,
            targetMessageId,
            toolCall,
            delta.block_id,
          );
        }
      }

      if (typeof delta.content === 'string') {
        this.appendTextBlock(
          conversationId,
          targetMessageId,
          delta.block_id ?? `text-${targetMessageId}`,
          delta.content,
        );
        this.update(conversationId, (state) => {
          if (!state.message) return state;
          return {
            ...state,
            message: {
              ...state.message,
              answer: `${state.message.answer ?? ''}${delta.content}`,
            },
            statusKey: null,
            statusMessage: null,
          };
        });
      }

      if (choice.finish_reason) {
        this.finish(conversationId, requestId, {
          isStreaming: false,
          isCancelling: false,
          completedAt: Date.now(),
          preview: createPreview(
            this.streams.get(conversationId)?.message?.answer,
          ),
          unread: true,
          statusKey: null,
          statusMessage: null,
        });
      }
    } finally {
      this.endBatch();
    }
  }

  private appendTextBlock(
    conversationId: string,
    messageId: string,
    blockId: string,
    content: string,
  ) {
    this.update(conversationId, (state) => {
      const blocks = state.outputBlocksByMessageId[messageId] ?? [];
      const last = blocks[blocks.length - 1];
      const nextBlocks: ConversationOutputBlock[] =
        last?.type === 'text' && last.id === blockId
          ? [...blocks.slice(0, -1), { ...last, text: last.text + content }]
          : [...blocks, { type: 'text', id: blockId, text: content }];
      return {
        ...state,
        outputBlocksByMessageId: {
          ...state.outputBlocksByMessageId,
          [messageId]: nextBlocks,
        },
      };
    });
  }

  private updateToolBlockFromTrace(
    conversationId: string,
    messageId: string,
    event: Record<string, unknown>,
  ) {
    const toolCallId = String(event['tool_call_id'] ?? '');
    const name = String(event['tool'] ?? 'tool');
    this.update(conversationId, (state) => {
      const blocks = state.outputBlocksByMessageId[messageId] ?? [];
      const index = blocks.findIndex(
        (block) =>
          block.type === 'tool_call' &&
          ((toolCallId && block.id === toolCallId) || block.name === name),
      );
      if (index < 0) return state;
      const block = blocks[index];
      if (block.type !== 'tool_call') return state;
      const updated: ConversationOutputBlock = {
        ...block,
        status:
          event['type'] === 'tool_end'
            ? event['status'] === 'error'
              ? 'failed'
              : 'completed'
            : 'running',
        summary: (event['summary'] as string | undefined) ?? block.summary,
        result: event['result'] ?? block.result,
      };
      return {
        ...state,
        outputBlocksByMessageId: {
          ...state.outputBlocksByMessageId,
          [messageId]: [
            ...blocks.slice(0, index),
            updated,
            ...blocks.slice(index + 1),
          ],
        },
      };
    });
  }

  private handleTraceEvent(
    conversationId: string,
    messageId: string,
    traceEvent: Record<string, unknown>,
  ) {
    const eventType = String(traceEvent['type'] ?? '');
    if (!eventType) return;

    if (eventType === 'tool_start' || eventType === 'tool_end') {
      this.updateToolBlockFromTrace(conversationId, messageId, traceEvent);
    }

    if (eventType === 'status') {
      const status = String(traceEvent['status'] ?? '');
      const statusKey = STREAM_STATUS_KEYS[status] ?? null;
      const timings = (traceEvent['timings'] ?? null) as StreamTimings | null;
      this.update(conversationId, (state) => ({
        ...state,
        statusKey,
        statusMessage:
          (traceEvent['message'] as string | null | undefined) ?? null,
        statusTimings: timings,
        traceEventsByMessageId: appendTraceEvent(
          state.traceEventsByMessageId,
          messageId,
          {
            type: eventType,
            status,
            message: traceEvent['message'],
            details: traceEvent['details'],
            timings,
          },
        ),
      }));
      return;
    }

    this.update(conversationId, (state) => ({
      ...state,
      traceEventsByMessageId: appendTraceEvent(
        state.traceEventsByMessageId,
        messageId,
        traceEvent as StreamTraceEvent,
      ),
    }));
  }

  private handleToolCall(
    conversationId: string,
    messageId: string,
    toolCall: {
      index: number;
      id?: string;
      type?: string;
      function?: { name?: string; arguments?: string };
    },
    blockId?: string | null,
  ) {
    const name = toolCall.function?.name;
    const args = toolCall.function?.arguments;
    const existingToolCallEvent = getToolCallTraceEvent(
      this.streams.get(conversationId)?.traceEventsByMessageId ?? {},
      messageId,
      toolCall,
    );
    const resolvedName =
      name ?? (existingToolCallEvent?.['tool'] as string | undefined);

    if (resolvedName) {
      const toolCallId =
        toolCall.id ??
        (existingToolCallEvent?.['tool_call_id'] as string | undefined);
      this.update(conversationId, (state) => {
        const blocks = state.outputBlocksByMessageId[messageId] ?? [];
        const outputBlockId =
          toolCallId ?? `tool-${blockId ?? messageId}-${toolCall.index}`;
        const blockIndex = blocks.findIndex(
          (block) => block.type === 'tool_call' && block.id === outputBlockId,
        );
        const toolBlock: ConversationOutputBlock = {
          type: 'tool_call',
          id: outputBlockId,
          name: resolvedName,
          status: 'running',
          args: parseToolCallArguments(args),
          toolCallIndex: toolCall.index,
        };
        const nextBlocks =
          blockIndex >= 0
            ? [
                ...blocks.slice(0, blockIndex),
                { ...blocks[blockIndex], ...toolBlock },
                ...blocks.slice(blockIndex + 1),
              ]
            : [...blocks, toolBlock];
        return {
          ...state,
          outputBlocksByMessageId: {
            ...state.outputBlocksByMessageId,
            [messageId]: nextBlocks,
          },
          traceEventsByMessageId: upsertToolCallTraceEvent(
            state.traceEventsByMessageId,
            messageId,
            {
              type: 'tool_start',
              source: 'tool_call',
              // The model turn, not the tool call: the thinking panel groups
              // trace events by turn and places each group after that turn's
              // output. Keyed by the call id, a tool started after streamed
              // text matched no output block and its panel jumped to the top.
              block_id: blockId ?? outputBlockId,
              tool: resolvedName,
              tool_call_id: toolCallId,
              tool_call_index: toolCall.index,
              short_description: formatToolCallDescription(resolvedName, args),
              details: parseToolCallArguments(args),
            },
          ),
        };
      });
    }

    if (name !== 'agent_selected' || !args) {
      return;
    }

    try {
      const parsed = JSON.parse(args) as {
        agent_id?: string | null;
        agent_name?: string | null;
      };
      this.updateMessage(conversationId, (message) => ({
        ...message,
        agent_id: parsed.agent_id ?? message.agent_id,
        agent_name: parsed.agent_name ?? message.agent_name,
      }));
    } catch {
      // ignore malformed arguments
    }
  }

  private finish(
    conversationId: string,
    requestId: string,
    updates: Partial<OpenAIConversationStreamState>,
  ) {
    this.update(conversationId, (state) => {
      if (state.requestId !== requestId || !state.isStreaming) return state;
      return {
        ...state,
        ...updates,
      };
    });
  }

  private updateMessage(
    conversationId: string,
    updater: (message: ConversationStreamMessage) => ConversationStreamMessage,
  ) {
    this.update(conversationId, (state) => {
      if (!state.message) return state;
      return { ...state, message: updater(state.message) };
    });
  }

  private update(
    conversationId: string,
    updater: (
      state: OpenAIConversationStreamState,
    ) => OpenAIConversationStreamState,
  ) {
    const current = this.streams.get(conversationId);
    if (!current) return;
    const next = updater(current);
    if (next === current) return;
    this.streams.set(conversationId, next);

    const activityChanged = hasActivityChanged(current, next);
    if (this.batchDepth > 0) {
      this.hasPendingEmit = true;
      this.hasPendingActivityEmit ||= activityChanged;
      return;
    }

    this.emit();
    if (activityChanged) {
      this.emitActivity();
    }
  }

  private beginBatch() {
    this.batchDepth += 1;
  }

  private endBatch() {
    this.batchDepth -= 1;
    if (this.batchDepth > 0 || !this.hasPendingEmit) return;

    const emitActivity = this.hasPendingActivityEmit;
    this.hasPendingEmit = false;
    this.hasPendingActivityEmit = false;
    this.emit();
    if (emitActivity) {
      this.emitActivity();
    }
  }

  private emitNow(emitActivity = true) {
    this.emit();
    if (emitActivity) {
      this.emitActivity();
    }
  }

  private emit() {
    this.snapshot = new Map(this.streams);
    for (const listener of this.listeners) {
      listener();
    }
  }

  private emitActivity() {
    this.activitySnapshot = new Map(
      [...this.streams.entries()].map(([conversationId, state]) => [
        conversationId,
        {
          conversationId: state.conversationId,
          organizationId: state.organizationId,
          workspaceId: state.workspaceId,
          completedAt: state.completedAt,
          preview: state.preview,
          unread: state.unread,
          title: state.title,
        },
      ]),
    );
    for (const listener of this.activityListeners) {
      listener();
    }
  }
}

function choiceMessageId(chunk: ChatCompletionChunk) {
  return chunk.choices[0]?.delta.message_id;
}

function getMonotonicTime() {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

function hasActivityChanged(
  current: OpenAIConversationStreamState,
  next: OpenAIConversationStreamState,
) {
  return (
    current.conversationId !== next.conversationId ||
    current.organizationId !== next.organizationId ||
    current.workspaceId !== next.workspaceId ||
    current.completedAt !== next.completedAt ||
    current.preview !== next.preview ||
    current.unread !== next.unread ||
    current.title !== next.title
  );
}

function appendTraceEvent(
  events: Record<string, StreamTraceEvent[]>,
  messageId: string,
  event: StreamTraceEvent,
) {
  return {
    ...events,
    [messageId]: [...(events[messageId] ?? []), event],
  };
}

function getToolCallTraceEvent(
  events: Record<string, StreamTraceEvent[]>,
  messageId: string,
  toolCall: { index: number; id?: string },
) {
  return (events[messageId] ?? []).find((event) => {
    if (event['source'] !== 'tool_call') return false;
    if (toolCall.id && event['tool_call_id'] === toolCall.id) return true;
    return event['tool_call_index'] === toolCall.index;
  });
}

function upsertToolCallTraceEvent(
  events: Record<string, StreamTraceEvent[]>,
  messageId: string,
  event: StreamTraceEvent,
) {
  const currentEvents = events[messageId] ?? [];
  const toolCallIndex = event['tool_call_index'];
  const toolCallId = event['tool_call_id'];
  const existingIndex = currentEvents.findIndex((currentEvent) => {
    if (currentEvent['source'] !== 'tool_call') return false;
    if (toolCallId && currentEvent['tool_call_id'] === toolCallId) return true;
    return currentEvent['tool_call_index'] === toolCallIndex;
  });

  const nextEvents = [...currentEvents];
  if (existingIndex === -1) {
    nextEvents.push(event);
  } else {
    nextEvents[existingIndex] = {
      ...nextEvents[existingIndex],
      ...event,
    };
  }

  return {
    ...events,
    [messageId]: nextEvents,
  };
}

function parseToolCallArguments(args: string | undefined) {
  if (!args) return undefined;
  try {
    return JSON.parse(args) as unknown;
  } catch {
    return args;
  }
}

function formatToolCallDescription(name: string, args: string | undefined) {
  const parsedArgs = parseToolCallArguments(args);
  if (
    name === 'search_knowledge_base' &&
    parsedArgs !== null &&
    typeof parsedArgs === 'object' &&
    'queries' in parsedArgs &&
    Array.isArray(parsedArgs.queries)
  ) {
    return parsedArgs.queries.join(', ');
  }

  return name;
}

function createPreview(answer: string | null | undefined) {
  const preview = (answer ?? '').replace(/\s+/g, ' ').trim();
  return preview ? preview.slice(0, 180) : null;
}

export const openaiConversationStreamManager =
  new OpenAIConversationStreamManager();
