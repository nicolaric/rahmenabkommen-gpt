'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@eos/shared/ui';
import { Brain, MessageCircle, MessagesSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router';
import { useConversations } from '../hooks/use-conversations';
import {
  buildBrainPath,
  buildConversationPath,
  buildNewConversationPath,
} from '../routing';

/** How many recent conversations the collapsed menu offers. */
const RECENT_CONVERSATION_LIMIT = 20;

export type CollapsedNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

/**
 * The icon rail shown while the sidebar is collapsed: the scope's entry
 * points as icons with tooltips, and its recent conversations behind a
 * dropdown instead of a list that has no room to render.
 */
export function NavCollapsed({
  orgId,
  workspaceId,
  items,
  unreadConversationIds,
}: {
  orgId: string;
  workspaceId?: string;
  items: CollapsedNavItem[];
  unreadConversationIds?: Set<string>;
}) {
  const { t } = useTranslation('navigation');
  const location = useLocation();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;
  // Only the collapsed rail shows this list, so the expanded sidebar's own
  // query stays the only one in flight otherwise.
  const { data: conversationsData } = useConversations(
    isCollapsed ? orgId : undefined,
    workspaceId,
  );
  const conversations = (conversationsData?.data ?? []).slice(
    0,
    RECENT_CONVERSATION_LIMIT,
  );
  const scope = { orgId, workspaceId };
  const brainPath = buildBrainPath(scope);
  const isOnConversation = location.pathname.includes('/conversations/');

  return (
    <SidebarGroup>
      <SidebarMenu fluidHover>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={t('newChat')}>
            <Link to={buildNewConversationPath(scope)}>
              <MessageCircle />
              <span>{t('newChat')}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={t('brain')}
            isActive={location.pathname === brainPath}
          >
            <Link to={brainPath}>
              <Brain />
              <span>{t('brain')}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {conversations.length > 0 ? (
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip={t('chats')}
                  isActive={
                    isOnConversation &&
                    !location.pathname.endsWith('/conversations/new')
                  }
                >
                  <MessagesSquare />
                  <span>{t('chats')}</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="start"
                className="max-h-[min(70vh,32rem)] w-72 overflow-y-auto"
              >
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  {t('chats')}
                </DropdownMenuLabel>
                {conversations.map((conversation) => {
                  const title =
                    conversation.title ??
                    conversation.last_message_preview ??
                    t('command.untitledConversation');
                  return (
                    <DropdownMenuItem key={conversation.id} asChild>
                      <NavLink
                        discover="none"
                        prefetch="none"
                        to={buildConversationPath(scope, conversation.id)}
                        className="flex min-w-0 items-center gap-2"
                      >
                        <span className="min-w-0 flex-1 truncate">{title}</span>
                        {unreadConversationIds?.has(conversation.id) ? (
                          <span
                            aria-label={t('conversationCompletedUnread')}
                            className="size-2 shrink-0 rounded-full bg-blue-500"
                            role="img"
                          />
                        ) : null}
                      </NavLink>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ) : null}
        {items.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              isActive={location.pathname.startsWith(
                item.url.replace(/\/general$/, ''),
              )}
            >
              <Link to={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
