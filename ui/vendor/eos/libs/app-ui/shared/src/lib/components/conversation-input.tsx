import type {
  Agent,
  ConversationDocumentContext,
  DocumentMetadata,
} from '@eos/data-access/api';
import { Button, Spinner } from '@eos/shared/ui';
import {
  ArrowUpIcon,
  AtSign,
  AudioLines,
  BookOpen,
  Check,
  FileText,
  Paperclip,
  Plus,
  Search,
  Square,
  Tag,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ConversationAttachmentCard,
  attachmentTypeLabel,
} from './conversation-attachment-card';
import type { ConversationInputAttachment } from './conversation-attachment-card';
import { ConversationDocumentCard } from './conversation-document-card';
import { QuoteCard } from './passage-ask-button';
import {
  DictationError,
  DictationTranscriber,
  isDictationSupported,
  useDictation,
} from './use-dictation';
import {
  ClipboardEvent,
  KeyboardEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useMemo,
  useState,
  useCallback,
} from 'react';

/* These mirror the DropdownMenu primitives in @eos/shared/ui so the document
   context popups read as the same surface as every other menu in the app. They
   are plain classes rather than the components themselves because this popup is
   anchored inside the input and driven by local open state - the base-ui menu
   portals elsewhere in the app are mocked out under jsdom, which would cost the
   behavioural coverage this picker has. */
/* The composer menu and the document/tag pickers it opens share one roomy
   surface, so moving from the menu into a picker reads as one family. */
const MENU_SURFACE_CLASS =
  'rounded-2xl border border-zinc-200 bg-white p-1.5 text-zinc-950 shadow-lg shadow-zinc-950/5 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-black/40';

const MENU_ITEM_CLASS =
  'relative flex w-full cursor-default select-none items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm outline-none hover:bg-zinc-100 focus-visible:bg-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 [&_svg:not([class*="text-"])]:text-zinc-500 dark:[&_svg:not([class*="text-"])]:text-zinc-400';

const MENU_ITEM_ACTIVE = 'bg-zinc-100 dark:bg-zinc-800';

const MENU_SEPARATOR_CLASS = '-mx-1.5 my-1.5 h-px bg-zinc-200 dark:bg-zinc-800';

const MENU_EMPTY_CLASS =
  'px-2 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400';

type ComposerMenuItem = {
  id: 'files' | 'library' | 'tags' | 'agent';
  icon: LucideIcon;
  title: string;
  description: string;
  onSelect: () => void;
  separatorBefore?: boolean;
};

interface ConversationInputProps {
  message: string;
  setMessage: (value: string) => void;
  handleSendMessage: () => void;
  isButtonLoading?: boolean;
  isGenerating?: boolean;
  isCancelling?: boolean;
  handleCancel?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  agents?: Agent[];
  documentOptions?: DocumentMetadata[];
  onDocumentSearch?: (query: string) => Promise<DocumentMetadata[]>;
  documentContext?: ConversationDocumentContext;
  onDocumentContextChange?: (
    context: ConversationDocumentContext,
  ) => void | Promise<void>;
  /** A passage from an answer the next question refers to, sent as a quote. */
  quote?: string | null;
  onRemoveQuote?: () => void;
  /** Turns a dictated recording into text. Without it there is no microphone. */
  onTranscribe?: DictationTranscriber;
  /**
   * Takes the dictated question instead of the input: called with the text
   * so far while the user talks (from '' when listening starts) and once
   * with `final` when they are done. Dictation then also ends by itself
   * when the user stops talking.
   */
  onDictation?: (text: string, final: boolean) => void;
  /** Files added to the next question, shown above the textarea. */
  attachments?: ConversationInputAttachment[];
  /**
   * Takes files picked from the menu or pasted into the input. Without it
   * the input offers no file upload.
   */
  onAddFiles?: (files: File[]) => void;
  onRemoveAttachment?: (id: string) => void;
  /** The `accept` list of the file picker, e.g. ".pdf,.docx". */
  acceptedFileTypes?: string;
}

/* A question ends after this much silence; shorter pauses are breathing or
   thinking within it. */
const END_OF_QUESTION_SILENCE_MS = 2000;
/* Listening stops if nothing is said after the tap. */
const NOTHING_SAID_MS = 8000;

const formatElapsed = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

const noTranscriber: DictationTranscriber = () => Promise.resolve('');

export const ConversationInput = forwardRef<
  HTMLTextAreaElement,
  ConversationInputProps
>(
  (
    {
      message,
      setMessage,
      handleSendMessage,
      isButtonLoading = false,
      isGenerating = false,
      isCancelling = false,
      handleCancel,
      onKeyDown,
      placeholder = 'Stelle deine Frage...',
      className = '',
      agents = [],
      documentOptions = [],
      onDocumentSearch,
      documentContext = {
        scope: 'default',
        document_ids: [],
        document_tags: [],
      },
      onDocumentContextChange,
      quote,
      onRemoveQuote,
      onTranscribe,
      onDictation,
      attachments = [],
      onAddFiles,
      onRemoveAttachment,
      acceptedFileTypes,
    },
    forwardedRef,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const contextPickerRef = useRef<HTMLDivElement>(null);
    const contextPickerTriggerRef = useRef<HTMLButtonElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const { t: translate, i18n } = useTranslation('conversation');
    const t = (key: string, fallback: string) =>
      i18n?.isInitialized
        ? translate(key, { defaultValue: fallback })
        : fallback;
    const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(
      null,
    );
    const [mentionQuery, setMentionQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const [contextPickerMode, setContextPickerMode] = useState<
      'documents' | 'tags' | null
    >(null);
    const [contextSearch, setContextSearch] = useState('');
    const [documentSearchResults, setDocumentSearchResults] = useState<
      DocumentMetadata[] | null
    >(null);
    const [isDocumentSearchLoading, setIsDocumentSearchLoading] =
      useState(false);
    const suppressMentionUpdateRef = useRef(false);
    // Checked after mount: the server render cannot know the browser.
    const [canDictate, setCanDictate] = useState(false);
    useEffect(() => {
      setCanDictate(Boolean(onTranscribe) && isDictationSupported());
    }, [onTranscribe]);

    // What was in the input when dictation started; the dictated text follows.
    const dictationBaseRef = useRef('');
    const dictation = useDictation({
      transcribe: onTranscribe ?? noTranscriber,
      endAfterSilenceMs: onDictation ? END_OF_QUESTION_SILENCE_MS : undefined,
      giveUpAfterMs: onDictation ? NOTHING_SAID_MS : undefined,
      onText: (text, final) => {
        if (onDictation) {
          onDictation(text, final);
          return;
        }
        const base = dictationBaseRef.current;
        setMessage(base && text ? `${base} ${text}` : base || text);
        if (!final) return;
        requestAnimationFrame(() => {
          const textarea = textareaRef.current;
          if (!textarea) return;
          textarea.focus();
          const end = textarea.value.length;
          textarea.setSelectionRange(end, end);
        });
      },
      onError: (error: DictationError) => {
        if (error === 'permission') {
          toast.error(
            t(
              'dictation.permissionDenied',
              'Allow microphone access to dictate a message.',
            ),
          );
        } else if (error === 'unsupported') {
          toast.error(
            t('dictation.unsupported', 'This browser cannot record audio.'),
          );
        } else {
          toast.error(
            t(
              'dictation.failed',
              'The recording could not be transcribed. Please try again.',
            ),
          );
        }
      },
    });
    const isRecording = dictation.state === 'recording';
    const isTranscribing = dictation.state === 'transcribing';
    const hasText = Boolean(message.trim());
    // A running dictation keeps the button until it ends, even if the user
    // types meanwhile; otherwise text turns it into send.
    const primaryAction: 'cancel' | 'dictation' | 'send' = isGenerating
      ? 'cancel'
      : isRecording || isTranscribing || (canDictate && !hasText)
        ? 'dictation'
        : 'send';
    // Files still on their way would be missing from the answer, and a failed
    // one has to be removed first, so either holds the question back.
    const hasPendingAttachments = attachments.some(
      (attachment) =>
        attachment.state === 'uploading' || attachment.state === 'processing',
    );
    const hasFailedAttachments = attachments.some(
      (attachment) => attachment.state === 'failed',
    );
    const sendBlockedReason = hasPendingAttachments
      ? t(
          'attachments.waitForProcessing',
          'Wait until your files are processed',
        )
      : hasFailedAttachments
        ? t(
            'attachments.removeFailed',
            'Remove the files that could not be added',
          )
        : null;

    useEffect(() => {
      adjustHeight();
    }, [message]);

    const activeAgents = useMemo(
      () => agents.filter((agent) => agent.status === 'active'),
      [agents],
    );

    const filteredAgents = useMemo(() => {
      if (mentionStartIndex === null) return [];
      const query = mentionQuery.trim().toLowerCase();
      if (!query) return activeAgents;
      return activeAgents.filter((agent) =>
        agent.name.toLowerCase().includes(query),
      );
    }, [activeAgents, mentionQuery, mentionStartIndex]);

    const isMentionDropdownOpen =
      mentionStartIndex !== null && filteredAgents.length > 0;

    const availableDocumentOptions = useMemo(() => {
      const documents = new Map(
        documentOptions.map((document) => [document.id, document]),
      );
      for (const document of documentSearchResults ?? []) {
        documents.set(document.id, document);
      }
      return Array.from(documents.values());
    }, [documentOptions, documentSearchResults]);
    const contextTags = useMemo(
      () =>
        Array.from(
          new Set(
            availableDocumentOptions.flatMap((document) => document.tags ?? []),
          ),
        ).sort(),
      [availableDocumentOptions],
    );
    const normalizedContextSearch = contextSearch.trim().toLowerCase();
    const filteredContextDocuments = useMemo(
      () =>
        (documentSearchResults ?? documentOptions).filter((document) =>
          document.name.toLowerCase().includes(normalizedContextSearch),
        ),
      [documentOptions, documentSearchResults, normalizedContextSearch],
    );

    useEffect(() => {
      if (contextPickerMode !== 'documents' || !onDocumentSearch) {
        setDocumentSearchResults(null);
        setIsDocumentSearchLoading(false);
        return;
      }

      let cancelled = false;
      setIsDocumentSearchLoading(true);
      const timeout = window.setTimeout(() => {
        void onDocumentSearch(contextSearch.trim())
          .then((documents) => {
            if (!cancelled) setDocumentSearchResults(documents);
          })
          .catch(() => {
            if (!cancelled) setDocumentSearchResults([]);
          })
          .finally(() => {
            if (!cancelled) setIsDocumentSearchLoading(false);
          });
      }, 250);

      return () => {
        cancelled = true;
        window.clearTimeout(timeout);
      };
    }, [contextPickerMode, contextSearch, onDocumentSearch]);
    const filteredContextTags = useMemo(
      () => contextTags.filter((tag) => tag.includes(normalizedContextSearch)),
      [contextTags, normalizedContextSearch],
    );

    const closeContextPicker = useCallback(() => {
      setIsContextMenuOpen(false);
      setContextPickerMode(null);
      setContextSearch('');
    }, []);

    const openContextPicker = useCallback((mode: 'documents' | 'tags') => {
      setIsContextMenuOpen(false);
      setContextPickerMode(mode);
      setContextSearch('');
    }, []);

    useEffect(() => {
      if (!isContextMenuOpen && !contextPickerMode) return;

      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target;
        if (
          target instanceof Node &&
          (contextMenuRef.current?.contains(target) ||
            contextPickerRef.current?.contains(target) ||
            contextPickerTriggerRef.current?.contains(target))
        ) {
          return;
        }

        closeContextPicker();
      };

      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          const hadFocus =
            event.target instanceof Node &&
            (contextMenuRef.current?.contains(event.target) ||
              contextPickerRef.current?.contains(event.target));
          closeContextPicker();
          // Focus would otherwise be lost with the closing popup.
          if (hadFocus) contextPickerTriggerRef.current?.focus();
        }
      };

      document.addEventListener('pointerdown', handlePointerDown, true);
      document.addEventListener('keydown', handleKeyDown, true);

      return () => {
        document.removeEventListener('pointerdown', handlePointerDown, true);
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }, [closeContextPicker, contextPickerMode, isContextMenuOpen]);

    const updateDocumentContext = useCallback(
      async (context: ConversationDocumentContext) => {
        await onDocumentContextChange?.(context);
      },
      [onDocumentContextChange],
    );

    const toggleContextDocument = useCallback(
      (documentId: string) => {
        const selected = new Set(
          documentContext.scope === 'selected'
            ? documentContext.document_ids
            : [],
        );
        if (selected.has(documentId)) selected.delete(documentId);
        else selected.add(documentId);
        void updateDocumentContext({
          scope: selected.size ? 'selected' : 'default',
          document_ids: Array.from(selected),
          document_tags: [],
        }).catch(() => undefined);
      },
      [documentContext, updateDocumentContext],
    );

    const toggleContextTag = useCallback(
      (tag: string) => {
        const selected = new Set(
          documentContext.scope === 'tagged'
            ? documentContext.document_tags
            : [],
        );
        if (selected.has(tag)) selected.delete(tag);
        else selected.add(tag);
        void updateDocumentContext({
          scope: selected.size ? 'tagged' : 'default',
          document_ids: [],
          document_tags: Array.from(selected),
        }).catch(() => undefined);
      },
      [documentContext, updateDocumentContext],
    );

    const removeContextItem = (value: string) => {
      if (documentContext.scope === 'selected') {
        toggleContextDocument(value);
      } else if (documentContext.scope === 'tagged') {
        toggleContextTag(value);
      }
    };

    const clearMentionContext = useCallback(() => {
      setMentionStartIndex(null);
      setMentionQuery('');
      setHighlightedIndex(0);
    }, []);

    const updateMentionContext = useCallback(
      (nextValue: string, cursorPosition: number | null) => {
        if (cursorPosition === null) {
          clearMentionContext();
          return;
        }

        const textBeforeCursor = nextValue.slice(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex === -1) {
          clearMentionContext();
          return;
        }

        const charBeforeAt =
          lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : '';
        if (lastAtIndex > 0 && !/\s/.test(charBeforeAt)) {
          clearMentionContext();
          return;
        }

        const mentionText = textBeforeCursor.slice(lastAtIndex + 1);
        if (/\s/.test(mentionText)) {
          clearMentionContext();
          return;
        }

        setMentionStartIndex(lastAtIndex);
        setMentionQuery(mentionText);
      },
      [clearMentionContext],
    );

    useEffect(() => {
      if (!textareaRef.current) return;
      if (suppressMentionUpdateRef.current) {
        suppressMentionUpdateRef.current = false;
        return;
      }
      updateMentionContext(message, textareaRef.current.selectionStart);
    }, [message, updateMentionContext]);

    useEffect(() => {
      setHighlightedIndex(0);
    }, [mentionQuery, mentionStartIndex]);

    useImperativeHandle(
      forwardedRef,
      () => textareaRef.current as HTMLTextAreaElement,
      [],
    );

    // ← Auto-grow Magie
    const adjustHeight = () => {
      const ta = textareaRef.current;
      if (!ta) return;

      ta.style.height = 'auto'; // zurücksetzen
      ta.style.height = `${ta.scrollHeight}px`; // echte Inhaltshöhe
    };

    const handleSelectAgent = (agent: Agent) => {
      if (mentionStartIndex === null) return;
      const textarea = textareaRef.current;
      const cursorPosition = textarea?.selectionStart ?? message.length;
      const selectionEnd = textarea?.selectionEnd ?? cursorPosition;
      const before = message.slice(0, mentionStartIndex);
      const after = message.slice(selectionEnd);
      const mentionText = `@"${agent.name}"`;
      const nextValue = `${before}${mentionText}${after}`;
      suppressMentionUpdateRef.current = true;
      setMessage(nextValue);
      clearMentionContext();

      requestAnimationFrame(() => {
        if (!textarea) return;
        const nextCursor = before.length + mentionText.length;
        textarea.focus();
        textarea.setSelectionRange(nextCursor, nextCursor);
      });
    };

    // Starts a mention at the caret, as typing "@" would, which opens the
    // agent dropdown.
    const startAgentMention = () => {
      const textarea = textareaRef.current;
      const start = textarea?.selectionStart ?? message.length;
      const end = textarea?.selectionEnd ?? start;
      const before = message.slice(0, start);
      // A mention only starts after whitespace or at the beginning.
      const prefix = before && !/\s$/.test(before) ? ' ' : '';
      const nextValue = `${before}${prefix}@${message.slice(end)}`;
      const nextCursor = before.length + prefix.length + 1;
      suppressMentionUpdateRef.current = true;
      setMessage(nextValue);
      requestAnimationFrame(() => {
        const current = textareaRef.current;
        if (!current) return;
        current.focus();
        current.setSelectionRange(nextCursor, nextCursor);
        updateMentionContext(nextValue, nextCursor);
      });
    };

    const menuItems: ComposerMenuItem[] = [];
    if (onAddFiles) {
      menuItems.push({
        id: 'files',
        icon: Paperclip,
        title: t('composerMenu.addFiles', 'Add photos & files'),
        description: t(
          'composerMenu.addFilesDescription',
          'Upload from your computer',
        ),
        onSelect: () => {
          closeContextPicker();
          fileInputRef.current?.click();
        },
      });
    }
    if (onDocumentContextChange) {
      menuItems.push(
        {
          id: 'library',
          icon: BookOpen,
          title: t('composerMenu.addFromLibrary', 'Add from library'),
          description: t(
            'composerMenu.addFromLibraryDescription',
            'Browse and search your documents',
          ),
          onSelect: () => openContextPicker('documents'),
        },
        {
          id: 'tags',
          icon: Tag,
          title: t('composerMenu.filterByTag', 'Filter by tag'),
          description: t(
            'composerMenu.filterByTagDescription',
            'Limit answers to tagged documents',
          ),
          onSelect: () => openContextPicker('tags'),
        },
      );
    }
    if (activeAgents.length > 0) {
      menuItems.push({
        id: 'agent',
        icon: AtSign,
        title: t('composerMenu.askAgent', 'Ask an agent'),
        description: t(
          'composerMenu.askAgentDescription',
          'Mention an agent with @',
        ),
        onSelect: () => {
          closeContextPicker();
          startAgentMention();
        },
        separatorBefore: menuItems.length > 0,
      });
    }

    // The first item takes focus when the menu opens, so it can be used
    // from the keyboard right away.
    useEffect(() => {
      if (!isContextMenuOpen) return;
      menuItemRefs.current[0]?.focus();
    }, [isContextMenuOpen]);

    const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      const items = menuItemRefs.current
        .slice(0, menuItems.length)
        .filter((item): item is HTMLButtonElement => Boolean(item));
      if (!items.length) return;
      const currentIndex = items.findIndex(
        (item) => item === document.activeElement,
      );
      let nextIndex: number | null = null;
      if (event.key === 'ArrowDown') {
        nextIndex = currentIndex + 1 >= items.length ? 0 : currentIndex + 1;
      } else if (event.key === 'ArrowUp') {
        nextIndex = currentIndex - 1 < 0 ? items.length - 1 : currentIndex - 1;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = items.length - 1;
      } else if (event.key === 'Tab') {
        closeContextPicker();
        return;
      }
      if (nextIndex === null) return;
      event.preventDefault();
      items[nextIndex]?.focus();
    };

    const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
      if (!onAddFiles) return;
      const files = Array.from(event.clipboardData?.files ?? []);
      if (!files.length) return;
      // Copying from Office apps puts a picture of the selection next to its
      // text; that paste is meant as text, so only file-only pastes upload.
      if (Array.from(event.clipboardData.types).includes('text/html')) return;
      event.preventDefault();
      onAddFiles(files);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        sendBlockedReason &&
        !isMentionDropdownOpen &&
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.metaKey &&
        !event.ctrlKey
      ) {
        // Enter would send, which has to wait for the files.
        event.preventDefault();
        return;
      }

      if (isMentionDropdownOpen) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev + 1 >= filteredAgents.length ? 0 : prev + 1,
          );
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev - 1 < 0 ? filteredAgents.length - 1 : prev - 1,
          );
          return;
        }

        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          handleSelectAgent(filteredAgents[highlightedIndex]);
          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          clearMentionContext();
          return;
        }
      }

      onKeyDown?.(event);
    };

    const describeDocument = (document?: DocumentMetadata) => {
      const extension = document?.name.includes('.')
        ? document.name.split('.').pop()
        : undefined;
      const fileType = document?.fileType ?? extension;
      return fileType
        ? fileType.replace(/^\./, '').toUpperCase()
        : t('documentContext.document', 'Document');
    };

    const activeContextItems =
      documentContext.scope === 'selected'
        ? documentContext.document_ids.map((id) => {
            const document = availableDocumentOptions.find(
              (candidate) => candidate.id === id,
            );
            return {
              value: id,
              label: document?.name ?? id,
              description: describeDocument(document),
            };
          })
        : documentContext.document_tags.map((tag) => ({
            value: tag,
            label: tag,
            description: t('documentContext.tag', 'Tag'),
          }));

    return (
      <div
        data-conversation-input-container="true"
        className={`
        relative w-full flex flex-col
        border border-gray-200 dark:border-gray-700
        rounded-[32px] px-4 py-2.5 /* Höheres Padding für die Pillen-Form */
        bg-white dark:bg-zinc-900
        ${className}
    `}
      >
        {quote ? (
          /* The quoted passage is shown, not edited: it is attached to the
             question when it is sent. */
          <QuoteCard
            className="mb-2"
            text={quote}
            onRemove={onRemoveQuote}
            removeLabel={t('actions.removeQuote', 'Remove quote')}
          />
        ) : null}

        {((onDocumentContextChange && activeContextItems.length > 0) ||
          attachments.length > 0) && (
          /* Attachment cards sit inside the input surface, above the
                 textarea row, so context reads as part of the composer. */
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <ConversationAttachmentCard
                key={attachment.id}
                attachment={attachment}
                statusLabel={
                  attachment.state === 'uploading'
                    ? t('attachments.uploading', 'Uploading…')
                    : attachment.state === 'processing'
                      ? t('attachments.processing', 'Processing…')
                      : attachment.state === 'failed'
                        ? attachment.error ||
                          t('attachments.failed', 'Could not be added')
                        : (attachmentTypeLabel(
                            attachment.name,
                            attachment.fileType,
                          ) ?? t('attachments.file', 'File'))
                }
                onRemove={
                  onRemoveAttachment
                    ? () => onRemoveAttachment(attachment.id)
                    : undefined
                }
                removeLabel={`${t('attachments.remove', 'Remove file')}: ${
                  attachment.name
                }`}
              />
            ))}
            {(onDocumentContextChange ? activeContextItems : []).map((item) => (
              <ConversationDocumentCard
                key={item.value}
                label={item.label}
                description={item.description}
                kind={documentContext.scope === 'tagged' ? 'tag' : 'document'}
                onRemove={() => removeContextItem(item.value)}
                removeLabel={`${t(
                  'documentContext.remove',
                  'Remove document context',
                )}: ${item.label}`}
              />
            ))}
          </div>
        )}

        <div className="flex w-full items-end gap-2">
          {menuItems.length > 0 && isContextMenuOpen && (
            <div
              ref={contextMenuRef}
              role="menu"
              aria-label={t('composerMenu.label', 'Add to your question')}
              aria-orientation="vertical"
              className={`absolute bottom-full left-2 z-50 mb-2 w-[min(20rem,calc(100vw-1.5rem))] ${MENU_SURFACE_CLASS}`}
              data-testid="conversation-document-context-menu"
              onKeyDown={handleMenuKeyDown}
            >
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.id}>
                    {item.separatorBefore ? (
                      <div role="separator" className={MENU_SEPARATOR_CLASS} />
                    ) : null}
                    <button
                      ref={(element) => {
                        menuItemRefs.current[index] = element;
                      }}
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      className={MENU_ITEM_CLASS}
                      onClick={item.onSelect}
                      data-testid={`conversation-menu-${item.id}`}
                    >
                      <Icon className="size-[1.125rem]" />
                      <span className="shrink-0 text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-zinc-500 dark:text-zinc-400">
                        {item.description}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {onAddFiles && (
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept={acceptedFileTypes}
              data-testid="conversation-file-input"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                // Cleared so picking the same file again still fires.
                event.target.value = '';
                if (files.length) onAddFiles(files);
              }}
            />
          )}

          {onDocumentContextChange && contextPickerMode && (
            <div
              ref={contextPickerRef}
              aria-busy={isDocumentSearchLoading}
              className={`absolute bottom-full left-2 z-50 mb-2 w-[min(20rem,calc(100vw-1.5rem))] ${MENU_SURFACE_CLASS}`}
            >
              {/* Search row, styled as a command palette input: flush with
                    the surface, separated by a rule rather than boxed in. */}
              <div className="-mx-1.5 -mt-1.5 mb-1.5 flex items-center gap-2 border-b border-zinc-200 px-3.5 dark:border-zinc-800">
                <Search className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                <input
                  autoFocus
                  value={contextSearch}
                  onChange={(event) => setContextSearch(event.target.value)}
                  placeholder={
                    contextPickerMode === 'documents'
                      ? t('documentContext.searchDocuments', 'Search documents')
                      : t('documentContext.searchTags', 'Search tags')
                  }
                  className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  onClick={closeContextPicker}
                  aria-label={t(
                    'documentContext.close',
                    'Close document context picker',
                  )}
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto">
                {isDocumentSearchLoading &&
                contextPickerMode === 'documents' ? (
                  <div className="flex justify-center py-6">
                    <Spinner className="size-4" />
                  </div>
                ) : contextPickerMode === 'documents' ? (
                  filteredContextDocuments.length === 0 ? (
                    <p className={MENU_EMPTY_CLASS}>
                      {t('documentContext.noDocuments', 'No documents found')}
                    </p>
                  ) : (
                    filteredContextDocuments.map((document) => {
                      const checked =
                        documentContext.scope === 'selected' &&
                        documentContext.document_ids.includes(document.id);
                      return (
                        <button
                          key={document.id}
                          type="button"
                          aria-pressed={checked}
                          className={MENU_ITEM_CLASS}
                          onClick={() => toggleContextDocument(document.id)}
                        >
                          <FileText />
                          <span className="flex-1 truncate">
                            {document.name}
                          </span>
                          {checked && (
                            <Check className="size-4 shrink-0 text-slate-900 dark:text-slate-50" />
                          )}
                        </button>
                      );
                    })
                  )
                ) : filteredContextTags.length === 0 ? (
                  <p className={MENU_EMPTY_CLASS}>
                    {t('documentContext.noTags', 'No tags found')}
                  </p>
                ) : (
                  filteredContextTags.map((tag) => {
                    const checked =
                      documentContext.scope === 'tagged' &&
                      documentContext.document_tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={checked}
                        className={MENU_ITEM_CLASS}
                        onClick={() => toggleContextTag(tag)}
                      >
                        <Tag />
                        <span className="flex-1 truncate">{tag}</span>
                        {checked && (
                          <Check className="size-4 shrink-0 text-slate-900 dark:text-slate-50" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              <div className={MENU_SEPARATOR_CLASS} />
              <div className="flex gap-1">
                <button
                  type="button"
                  className={`${MENU_ITEM_CLASS} ${
                    contextPickerMode === 'documents' ? MENU_ITEM_ACTIVE : ''
                  }`}
                  onClick={() => openContextPicker('documents')}
                >
                  <FileText />
                  {t('documentContext.documents', 'Documents')}
                </button>
                <button
                  type="button"
                  className={`${MENU_ITEM_CLASS} ${
                    contextPickerMode === 'tags' ? MENU_ITEM_ACTIVE : ''
                  }`}
                  onClick={() => openContextPicker('tags')}
                >
                  <Tag />
                  {t('documentContext.tags', 'Tags')}
                </button>
              </div>
            </div>
          )}

          {menuItems.length > 0 && (
            <button
              ref={contextPickerTriggerRef}
              type="button"
              className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              onClick={() => {
                if (isContextMenuOpen || contextPickerMode) {
                  closeContextPicker();
                  return;
                }

                setIsContextMenuOpen(true);
              }}
              aria-label={t('composerMenu.open', 'Add files and more')}
              aria-haspopup="menu"
              aria-expanded={isContextMenuOpen}
              data-testid="conversation-document-context-button"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}

          <textarea
            ref={textareaRef}
            data-conversation-input="true"
            value={message}
            onChange={(e) => {
              const nextValue = e.target.value;
              const command = nextValue.trim().toLowerCase();
              if (command === '/documents' || command === '/tags') {
                openContextPicker(command === '/tags' ? 'tags' : 'documents');
                setMessage('');
                return;
              }
              setMessage(nextValue);
              adjustHeight();
              updateMentionContext(nextValue, e.target.selectionStart);
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            /* The dictated text is written in as it arrives; typing at the
               same time would be overwritten. */
            readOnly={!onDictation && (isRecording || isTranscribing)}
            onClick={() =>
              updateMentionContext(
                textareaRef.current?.value ?? message,
                textareaRef.current?.selectionStart ?? null,
              )
            }
            onKeyUp={() =>
              updateMentionContext(
                textareaRef.current?.value ?? message,
                textareaRef.current?.selectionStart ?? null,
              )
            }
            placeholder={placeholder}
            rows={1}
            className={`
                flex-1 min-w-0 resize-none bg-inherit
                pb-1.75 pt-1.5 px-1 
                min-h-[24px] max-h-64
                text-base leading-normal
                outline-none overflow-y-auto scrollbar-hide
                text-zinc-900 dark:text-zinc-100
                caret-[var(--primary)]
            `}
            style={{ height: 'auto' }}
          />

          {isMentionDropdownOpen && (
            <div
              className="absolute bottom-full left-4 right-4 mb-2 z-50"
              data-testid="agent-mention-dropdown"
            >
              <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-zinc-900">
                {filteredAgents.map((agent, index) => (
                  <button
                    key={agent.id}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      index === highlightedIndex
                        ? 'bg-gray-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                        : 'text-zinc-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800'
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectAgent(agent)}
                    data-testid={`agent-mention-option-${agent.id}`}
                  >
                    {agent.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* One primary button: talk while the input is empty, send once
              there is text, stop while an answer is generated. */}
          <div
            className="mb-0.5 flex shrink-0 items-center gap-1.5"
            /* A disabled button shows no tooltip of its own, so the reason
               sending waits sits on its wrapper. */
            title={
              primaryAction === 'send' && sendBlockedReason
                ? sendBlockedReason
                : undefined
            }
            data-testid="conversation-send-wrapper"
          >
            {isRecording && (
              <span className="flex items-center gap-1.5 text-sm tabular-nums text-red-600 dark:text-red-400">
                {/* Phrases already spoken that are still being written out. */}
                {dictation.pendingPhrases > 0 && (
                  <Spinner
                    className="h-3 w-3 text-zinc-400"
                    data-testid="dictation-pending"
                  />
                )}
                <span data-testid="dictation-elapsed">
                  {formatElapsed(dictation.elapsedMs)}
                </span>
              </span>
            )}
            <Button
              size="icon"
              className={`
                    h-9 w-9 rounded-full
                    ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-500 dark:text-white'
                        : 'bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-black'
                    }
                    text-white disabled:opacity-40 shadow-sm
                `}
              onClick={
                primaryAction === 'cancel'
                  ? handleCancel
                  : primaryAction === 'dictation'
                    ? () => {
                        if (isRecording) {
                          dictation.stop();
                          return;
                        }
                        dictationBaseRef.current = message.trim();
                        void dictation.start();
                      }
                    : handleSendMessage
              }
              disabled={
                primaryAction === 'cancel'
                  ? !handleCancel || isCancelling
                  : primaryAction === 'dictation'
                    ? isTranscribing
                    : isButtonLoading || !hasText || Boolean(sendBlockedReason)
              }
              aria-pressed={
                primaryAction === 'dictation' ? isRecording : undefined
              }
              aria-label={
                primaryAction === 'cancel'
                  ? t('actions.stopGenerating', 'Stop generating')
                  : primaryAction === 'send'
                    ? t('actions.send', 'Send message')
                    : isTranscribing
                      ? t('dictation.transcribing', 'Transcribing...')
                      : isRecording
                        ? t('dictation.stop', 'Stop dictation')
                        : t('dictation.start', 'Dictate a message')
              }
              data-testid={
                primaryAction === 'dictation'
                  ? 'conversation-dictation-button'
                  : 'conversation-send-button'
              }
            >
              {isCancelling || isButtonLoading || isTranscribing ? (
                <Spinner className="h-4 w-4" />
              ) : primaryAction === 'cancel' ? (
                <Square className="h-4 w-4" strokeWidth={2.5} />
              ) : isRecording ? (
                <Square className="h-3.5 w-3.5 fill-current" />
              ) : primaryAction === 'dictation' ? (
                <AudioLines className="h-5 w-5" strokeWidth={2.25} />
              ) : (
                <ArrowUpIcon className="h-4 w-4" strokeWidth={2.5} />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  },
);
