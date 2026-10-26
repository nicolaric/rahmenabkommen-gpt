'use client';

import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@eos/shared/ui';
import { Brain, MessageCircle, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { buildBrainPath, buildNewConversationPath } from '../routing';

const brainSeenStoragePrefix = 'eos:brain-nav-seen:';
const brainSeenEvent = 'eos:brain-nav-seen';

function hasSeenBrain(orgId: string) {
  try {
    return (
      window.localStorage.getItem(`${brainSeenStoragePrefix}${orgId}`) ===
      'true'
    );
  } catch {
    return false;
  }
}

function markBrainSeen(orgId: string) {
  try {
    window.localStorage.setItem(`${brainSeenStoragePrefix}${orgId}`, 'true');
  } catch {
    // The dot is still dismissed for this render when storage is unavailable.
  }
  window.dispatchEvent(new Event(brainSeenEvent));
}

/**
 * The "new conversation" and "search" entries for one scope.
 *
 * Both the organization and the workspace section render their own copy, so
 * starting a conversation from a section creates it in that section's scope
 * rather than in whatever scope the current route happens to be.
 */
export function NavScopeActions({
  orgId,
  workspaceId,
  onOpenCommandPalette,
}: {
  orgId: string;
  workspaceId?: string;
  onOpenCommandPalette?: () => void;
}) {
  const { t } = useTranslation('navigation');
  const location = useLocation();
  const [isMac, setIsMac] = useState(false);
  const [showBrainDot, setShowBrainDot] = useState(false);

  useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform));
  }, []);

  useEffect(() => {
    const syncBrainDot = () => setShowBrainDot(!hasSeenBrain(orgId));
    syncBrainDot();
    window.addEventListener(brainSeenEvent, syncBrainDot);
    return () => window.removeEventListener(brainSeenEvent, syncBrainDot);
  }, [orgId]);

  const dismissBrainDot = () => {
    setShowBrainDot(false);
    markBrainSeen(orgId);
  };

  const searchShortcut = t(
    isMac ? 'searchShortcutMac' : 'searchShortcutNonMac',
  );
  const brainPath = buildBrainPath({ orgId, workspaceId });

  return (
    <SidebarMenu fluidHover>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={t('newChat')}>
          <Link to={buildNewConversationPath({ orgId, workspaceId })}>
            <MessageCircle />
            <span>{t('newChat')}</span>
          </Link>
        </SidebarMenuButton>
        {/* Search rides along as an icon action rather than owning a row of
            its own - it is a shortcut-first affordance, and a row per scope
            meant the same palette was listed twice in the sidebar. */}
        {onOpenCommandPalette ? (
          <SidebarMenuAction
            type="button"
            onClick={onOpenCommandPalette}
            aria-label={`${t('search')} (${searchShortcut})`}
            title={`${t('search')} (${searchShortcut})`}
          >
            <Search />
          </SidebarMenuAction>
        ) : null}
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip={t('brain')}
          isActive={location.pathname === brainPath}
        >
          <Link to={brainPath} onClick={dismissBrainDot} className="relative">
            <Brain />
            <span>{t('brain')}</span>
            {showBrainDot && (
              <span
                aria-label={t('brainNew')}
                className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-background"
                data-testid="brain-notification-dot"
                role="img"
              />
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
