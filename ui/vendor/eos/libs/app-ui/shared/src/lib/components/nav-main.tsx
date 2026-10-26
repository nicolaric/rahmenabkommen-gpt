import {
  ConversationListConversation,
  deleteConversation,
  updateConversationClient,
} from '@eos/data-access/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@eos/shared/ui';
import { useQueryClient } from '@tanstack/react-query';
import {
  NavLink,
  useLocation,
  useNavigate,
  useRevalidator,
} from 'react-router';
import { MoreVertical, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@eos/utils';
import { toast } from 'sonner';
import { buildConversationPath, buildNewConversationPath } from '../routing';
import { groupConversations } from './conversation-groups';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';

/** Loads the next page once the end of the list scrolls into view. */
function LoadMore({
  onLoadMore,
  isLoading,
  label,
}: {
  onLoadMore: () => void;
  isLoading: boolean;
  label: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || isLoading || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [isLoading, onLoadMore]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onLoadMore}
      disabled={isLoading}
      className="w-full px-2 py-1.5 text-left text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export function NavMain({
  conversations,
  unreadConversationIds,
  activeTeamId,
  activeWorkspaceId,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: {
  conversations: ConversationListConversation[];
  unreadConversationIds?: Set<string>;
  activeTeamId: string;
  activeWorkspaceId?: string;
  /** Older conversations exist beyond the loaded pages. */
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const queryClient = useQueryClient();
  const { t } = useTranslation('navigation');

  const [deletingConversationId, setDeletingConversationId] = useState<
    string | null
  >(null);

  // State to track which conversation is currently targeted for deletion via the dialog
  const [conversationToDelete, setConversationToDelete] = useState<{
    id: string;
    name: string;
    orgId: string;
    workspaceId?: string;
  } | null>(null);

  const [renamingConversationId, setRenamingConversationId] = useState<
    string | null
  >(null);
  const [renameDraft, setRenameDraft] = useState('');

  const refreshConversations = () => {
    queryClient.invalidateQueries({
      queryKey: ['conversations', activeTeamId, activeWorkspaceId],
    });
    // Titles also appear in loader data, e.g. the page breadcrumb.
    revalidator.revalidate();
  };

  const updateConversation = async (
    conversationId: string,
    changes: { title?: string; pinned?: boolean },
    failureMessage: string,
  ) => {
    try {
      await updateConversationClient(conversationId, activeTeamId, changes, {
        workspaceId: activeWorkspaceId,
      });
      refreshConversations();
    } catch (error) {
      console.error(error);
      toast.error(failureMessage);
    }
  };

  const startRename = (conversation: ConversationListConversation) => {
    setRenameDraft(getConversationTitle(conversation));
    setRenamingConversationId(conversation.id);
  };

  const finishRename = async (conversation: ConversationListConversation) => {
    const title = renameDraft.trim();
    setRenamingConversationId(null);
    if (!title || title === getConversationTitle(conversation)) return;
    await updateConversation(
      conversation.id,
      { title },
      t('conversationRenameFailed'),
    );
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;

    const { id, orgId, workspaceId } = conversationToDelete;
    setDeletingConversationId(id);

    try {
      await deleteConversation(id, orgId, { workspaceId });
      toast.success(t('conversationDeleted'));
      queryClient.invalidateQueries({
        queryKey: ['conversations', orgId, workspaceId],
      });

      if (location.pathname.includes(id)) {
        navigate(buildNewConversationPath({ orgId, workspaceId }));
      }
      revalidator.revalidate();
    } catch (error) {
      console.error(error);
      toast.error(t('conversationDeleteFailed'));
    } finally {
      setDeletingConversationId(null);
      setConversationToDelete(null);
    }
  };

  if (!conversations.length) {
    return null;
  }

  const getConversationTitle = (conversation: ConversationListConversation) =>
    conversation.title ??
    conversation.last_message_preview ??
    t('command.untitledConversation');

  const renderConversation = (conversation: ConversationListConversation) => {
    const hasUnreadCompletion = unreadConversationIds?.has(conversation.id);
    const title = getConversationTitle(conversation);

    if (renamingConversationId === conversation.id) {
      return (
        <SidebarMenuItem key={conversation.id}>
          <input
            autoFocus
            aria-label={t('renameConversation')}
            value={renameDraft}
            maxLength={255}
            onChange={(event) => setRenameDraft(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            onBlur={() => void finishRename(conversation)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
              if (event.key === 'Escape') setRenamingConversationId(null);
            }}
            className="h-8 w-full rounded-md border border-sidebar-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          />
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem
        key={conversation.id}
        className="group/conversation-item"
      >
        <SidebarMenuButton
          asChild
          tooltip={title}
          isActive={location.pathname.includes(conversation.id)}
        >
          <NavLink
            discover="none"
            prefetch="none"
            to={buildConversationPath(
              { orgId: activeTeamId, workspaceId: activeWorkspaceId },
              conversation.id,
            )}
            className="flex min-w-0 items-center pr-8"
          >
            <span className="min-w-0 flex-1 truncate pr-2">{title}</span>
            {hasUnreadCompletion ? (
              <span
                aria-label={t('conversationCompletedUnread')}
                className="ml-auto size-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_0_2px_var(--sidebar)]"
              />
            ) : null}
          </NavLink>
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction
              className={cn(
                'opacity-0 transition-opacity group-hover/conversation-item:opacity-100 group-focus-within/conversation-item:opacity-100',
                deletingConversationId === conversation.id &&
                  'pointer-events-none opacity-50',
              )}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreVertical />
              <span className="sr-only">{t('conversationActions')}</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => startRename(conversation)}>
              <Pencil className="mr-2 size-4" />
              {t('renameConversation')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                void updateConversation(
                  conversation.id,
                  { pinned: !conversation.pinned },
                  t('conversationPinFailed'),
                )
              }
            >
              {conversation.pinned ? (
                <PinOff className="mr-2 size-4" />
              ) : (
                <Pin className="mr-2 size-4" />
              )}
              {conversation.pinned
                ? t('unpinConversation')
                : t('pinConversation')}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={deletingConversationId === conversation.id}
              onSelect={() => {
                setConversationToDelete({
                  id: conversation.id,
                  name: title,
                  orgId: activeTeamId,
                  workspaceId: activeWorkspaceId,
                });
              }}
            >
              <Trash2 className="mr-2 size-4" />
              {t('deleteConversation')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      {/* Rendered inside a scope section that already supplies the group
          padding, so this one adds none of its own. SidebarGroup fills its
          parent by default; stacked groups must size to their rows instead,
          or each one takes the whole visible list. */}
      {groupConversations(conversations).map((group) => (
        <SidebarGroup key={group.key} className="h-auto px-0">
          <SidebarGroupLabel>
            {t(`conversationGroups.${group.key}`)}
          </SidebarGroupLabel>
          <SidebarMenu fluidHover>
            {group.conversations.map((conversation) =>
              renderConversation(conversation),
            )}
          </SidebarMenu>
        </SidebarGroup>
      ))}
      {hasMore && onLoadMore ? (
        <LoadMore
          onLoadMore={onLoadMore}
          isLoading={isLoadingMore}
          label={t('loadMoreConversations')}
        />
      ) : null}

      <DeleteConfirmationDialog
        open={conversationToDelete !== null}
        onOpenChange={(open) => !open && setConversationToDelete(null)}
        title={t('deleteConversationConfirmTitle')}
        description={t('deleteConversationConfirm', {
          name: conversationToDelete?.name ?? '',
        })}
        cancelLabel={t('cancel')}
        confirmLabel={t('delete')}
        isPending={deletingConversationId !== null}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
