'use client';

import { ConversationListConversation } from '@eos/data-access/api';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@eos/shared/ui';
import {
  Bot,
  Brain,
  Building2,
  Cpu,
  FileStack,
  MessageSquarePlus,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import {
  buildBrainPath,
  buildConversationPath,
  buildDocumentsPath,
  buildNewConversationPath,
} from '../routing';
import { useConversationSearch } from '../hooks/use-conversations';

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: ConversationListConversation[];
  teams: { id: string; name: string }[];
  workspaces: { id: string; name: string }[];
  activeTeamId: string;
  activeWorkspaceId?: string;
  canManageOrganization: boolean;
  isConversationOnly: boolean;
};

type PaletteItem = {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  shortcut?: string;
  /** Extra text the palette's own filter matches, e.g. a server-side hit. */
  keywords?: string[];
};

const SEARCH_DEBOUNCE_MS = 250;

export function CommandPalette({
  open,
  onOpenChange,
  conversations,
  teams,
  workspaces,
  activeTeamId,
  activeWorkspaceId,
  canManageOrganization,
  isConversationOnly,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('navigation');
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(
      () => setSearchQuery(query),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);
  // Searching goes to the server, which also matches older conversations and
  // message text, not only the titles loaded in the sidebar.
  const { data: searchResults } = useConversationSearch(
    activeTeamId,
    activeWorkspaceId,
    searchQuery,
  );
  const isSearching = query.trim().length > 0;

  const actionItems = useMemo<PaletteItem[]>(() => {
    const baseItems: PaletteItem[] = [
      {
        id: 'new-conversation',
        label: t('command.newConversation'),
        description: t('command.newConversationDescription'),
        href: buildNewConversationPath({
          orgId: activeTeamId,
          workspaceId: activeWorkspaceId,
        }),
        icon: MessageSquarePlus,
        shortcut: 'G N',
      },
    ];

    if (!isConversationOnly) {
      baseItems.push(
        {
          id: 'documents',
          label: t('documents'),
          description: t('command.documentsDescription'),
          href: buildDocumentsPath({
            orgId: activeTeamId,
            workspaceId: activeWorkspaceId,
          }),
          icon: FileStack,
          shortcut: 'G D',
        },
        {
          id: 'brain',
          label: t('brain'),
          description: t('command.brainDescription'),
          href: buildBrainPath({
            orgId: activeTeamId,
            workspaceId: activeWorkspaceId,
          }),
          icon: Brain,
          shortcut: 'G B',
        },
        {
          id: 'users',
          label: t('users'),
          description: t('command.usersDescription'),
          href: activeWorkspaceId
            ? `/${activeTeamId}/workspaces/${activeWorkspaceId}/users`
            : `/${activeTeamId}/users`,
          icon: Users,
        },
      );
    }

    if (activeWorkspaceId && !isConversationOnly) {
      baseItems.push({
        id: 'workspace-settings',
        label: t('workspaceSettings'),
        description: t('command.workspaceSettingsDescription'),
        href: `/${activeTeamId}/workspaces/${activeWorkspaceId}/settings/general`,
        icon: Settings,
      });
    }

    if (canManageOrganization && !isConversationOnly) {
      baseItems.push(
        {
          id: 'agents',
          label: t('agents'),
          description: t('command.agentsDescription'),
          href: `/${activeTeamId}/agents`,
          icon: Cpu,
        },
        {
          id: 'tools',
          label: t('tools'),
          description: t('command.toolsDescription'),
          href: `/${activeTeamId}/tools`,
          icon: Wrench,
        },
        {
          id: 'organization-settings',
          label: t('command.organizationSettings'),
          description: t('command.organizationSettingsDescription'),
          href: `/${activeTeamId}/organization-settings/general`,
          icon: Settings,
        },
      );
    }

    return baseItems;
  }, [
    activeTeamId,
    activeWorkspaceId,
    canManageOrganization,
    isConversationOnly,
    t,
  ]);

  const conversationItems = useMemo<PaletteItem[]>(
    () =>
      (isSearching
        ? (searchResults?.data ?? [])
        : conversations.slice(0, 8)
      ).map((conversation) => ({
        id: `conversation-${conversation.id}`,
        label: conversation.title || t('command.untitledConversation'),
        description:
          conversation.last_message_preview ||
          t('command.conversationDescription'),
        href: buildConversationPath(
          { orgId: activeTeamId, workspaceId: activeWorkspaceId },
          conversation.id,
        ),
        icon: Bot,
        // The server matched it; keep it visible whatever the label says.
        keywords: isSearching ? [query] : undefined,
      })),
    [
      activeTeamId,
      activeWorkspaceId,
      conversations,
      isSearching,
      query,
      searchResults,
      t,
    ],
  );

  const teamItems = useMemo<PaletteItem[]>(
    () =>
      teams.map((team) => ({
        id: `team-${team.id}`,
        label: team.name,
        description: t('command.switchOrganization'),
        href: `/${team.id}/conversations/new`,
        icon: Building2,
      })),
    [teams, t],
  );

  const workspaceItems = useMemo<PaletteItem[]>(
    () =>
      workspaces.map((workspace) => ({
        id: `workspace-${workspace.id}`,
        label: workspace.name,
        description: t('command.switchWorkspace'),
        href: `/${activeTeamId}/workspaces/${workspace.id}/conversations/new`,
        icon: Building2,
      })),
    [activeTeamId, t, workspaces],
  );

  const runCommand = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  const renderItems = (items: PaletteItem[]) =>
    items.map((item) => {
      const Icon = item.icon;

      return (
        <CommandItem
          key={item.id}
          value={[item.label, item.description, item.href]
            .filter(Boolean)
            .join(' ')}
          keywords={item.keywords}
          onSelect={() => runCommand(item.href)}
        >
          <Icon />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate">{item.label}</span>
            {item.description ? (
              <span className="text-muted-foreground truncate text-xs">
                {item.description}
              </span>
            ) : null}
          </span>
          {item.shortcut ? (
            <CommandShortcut>{item.shortcut}</CommandShortcut>
          ) : null}
        </CommandItem>
      );
    });

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('command.title')}
      description={t('command.description')}
      showCloseButton={false}
    >
      <CommandInput
        placeholder={t('command.placeholder')}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{t('command.empty')}</CommandEmpty>
        <CommandGroup heading={t('command.actions')}>
          {renderItems(actionItems)}
        </CommandGroup>
        {conversationItems.length ? (
          <>
            <CommandSeparator />
            <CommandGroup
              heading={
                isSearching
                  ? t('command.matchingConversations')
                  : t('command.recentConversations')
              }
            >
              {renderItems(conversationItems)}
            </CommandGroup>
          </>
        ) : null}
        {workspaceItems.length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('workspaces')}>
              {renderItems(workspaceItems)}
            </CommandGroup>
          </>
        ) : null}
        {teamItems.length > 1 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('teams')}>
              {renderItems(teamItems)}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
