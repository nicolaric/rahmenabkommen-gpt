'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from '@eos/shared/ui';
import { Cpu, FileStack, Settings, Users, Wrench } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';
import { useLocation } from 'react-router';
import { NavCollapsed } from './nav-collapsed';
import { NavUser } from './nav-user';
import { OrganizationSwitcher } from './organization-switcher';
import { WorkspaceSwitcher } from './workspace-switcher';
import { useTranslation } from 'react-i18next';
import { buildDocumentsPath } from '../routing';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  teams: {
    id: string;
    name: string;
    plan: string;
    logo_content_hash?: string | null;
    features?: Record<string, boolean>;
  }[];
  workspaces: {
    id: string;
    name: string;
    is_disabled?: boolean;
  }[];
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  unreadConversationIds?: Set<string>;
  activeTeamId: string;
  activeWorkspaceId?: string;
  canManageOrganization: boolean;
  isConversationOnly: boolean;
  enableWorkspaces?: boolean;
  onOpenCommandPalette: () => void;
}

export function AppSidebar({
  teams,
  workspaces,
  user,
  unreadConversationIds,
  activeTeamId,
  activeWorkspaceId,
  canManageOrganization,
  isConversationOnly,
  enableWorkspaces = false,
  onOpenCommandPalette,
  ...props
}: AppSidebarProps) {
  const { t } = useTranslation('navigation');
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const selectedWorkspaceId =
    activeWorkspaceId ??
    workspaces.find(
      (workspace) => !workspace.is_disabled || canManageOrganization,
    )?.id ??
    workspaces[0]?.id;
  const [openSection, setOpenSection] = React.useState<
    'organization' | 'workspace' | null
  >(() =>
    enableWorkspaces &&
    (location.pathname.includes('/workspaces/') || isConversationOnly)
      ? 'workspace'
      : 'organization',
  );
  React.useEffect(() => {
    if (!enableWorkspaces) {
      setOpenSection('organization');
    }
  }, [enableWorkspaces]);

  React.useEffect(() => {
    if (enableWorkspaces && location.pathname.includes('/workspaces/')) {
      setOpenSection('workspace');
    }
  }, [enableWorkspaces, location.pathname]);

  // With no workspace section there is nothing to fold the organization away
  // for, so the organization section stays permanently expanded.
  const showWorkspaceSection =
    enableWorkspaces && (workspaces.length > 0 || !isConversationOnly);

  const handleSectionChange = (
    section: 'organization' | 'workspace',
    open: boolean,
  ) => {
    setOpenSection(open ? section : null);
  };

  const workspaceItems = [
    ...(selectedWorkspaceId
      ? [
          {
            title: t('documents'),
            url: buildDocumentsPath({
              orgId: activeTeamId,
              workspaceId: selectedWorkspaceId,
            }),
            icon: FileStack,
          },
          {
            title: t('users'),
            url: `/${activeTeamId}/workspaces/${selectedWorkspaceId}/users`,
            icon: Users,
          },
          {
            title: t('settings'),
            url: `/${activeTeamId}/workspaces/${selectedWorkspaceId}/settings/general`,
            icon: Settings,
            subItems: [
              {
                title: t('settingsGeneral'),
                url: `/${activeTeamId}/workspaces/${selectedWorkspaceId}/settings/general`,
              },
            ],
          },
        ]
      : []),
  ];

  // We build the data object inside the component to use the activeTeamId prop
  const data = {
    organization: isConversationOnly
      ? []
      : [
          {
            title: t('documents'),
            url: buildDocumentsPath({ orgId: activeTeamId }),
            icon: FileStack,
          },
          {
            title: t('users'),
            url: `/${activeTeamId}/users`,
            icon: Users,
          },
          ...(canManageOrganization
            ? [
                {
                  title: t('agents'),
                  url: `/${activeTeamId}/agents`,
                  icon: Cpu,
                },
              ]
            : []),
          {
            title: t('tools'),
            url: `/${activeTeamId}/tools`,
            icon: Wrench,
          },
          ...(canManageOrganization
            ? [
                {
                  title: t('settings'),
                  url: `/${activeTeamId}/organization-settings/general`,
                  icon: Settings,
                  subItems: [
                    {
                      title: t('settingsGeneral'),
                      url: `/${activeTeamId}/organization-settings/general`,
                    },
                    {
                      title: t('settingsSubscription'),
                      url: `/${activeTeamId}/organization-settings/subscription`,
                    },
                    {
                      title: t('settingsApiKeys'),
                      url: `/${activeTeamId}/organization-settings/api-keys`,
                    },
                  ],
                },
              ]
            : []),
        ],
  };

  const getScopeMotion = (
    scope: 'organization' | 'workspace',
  ): React.ComponentProps<typeof motion.div> => {
    const isActive = openSection === scope;

    return {
      initial: false,
      // Opening a scope moves the workspace header between the top and the
      // bottom of the sidebar; animate that position change so it slides
      // instead of jumping. "position" avoids scale-distorting the content.
      layout: prefersReducedMotion ? false : 'position',
      animate: { opacity: isActive ? 1 : 0.6 },
      transition: {
        duration: prefersReducedMotion ? 0 : 0.28,
        ease: [0.16, 1, 0.3, 1],
      },
    };
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      {/*
        A collapsed organization leaves the workspace selector sitting directly
        beneath it. When either section is open, it fills the available space
        and keeps its conversation list scrolling internally instead of growing
        past the sidebar.
      */}
      <SidebarContent className="overflow-hidden group-data-[collapsible=icon]:hidden">
        <motion.div
          data-scope-view="organization"
          data-scope-active={openSection === 'organization'}
          className={
            openSection === 'organization' || !showWorkspaceSection
              ? 'min-h-0 flex-1 overflow-hidden'
              : 'shrink-0'
          }
          {...getScopeMotion('organization')}
        >
          <OrganizationSwitcher
            teams={teams}
            activeTeamId={activeTeamId}
            items={data.organization}
            unreadConversationIds={unreadConversationIds}
            onOpenCommandPalette={onOpenCommandPalette}
            open={openSection === 'organization'}
            onOpenChange={(open) => handleSectionChange('organization', open)}
            collapsible={showWorkspaceSection}
          />
        </motion.div>
        {showWorkspaceSection ? (
          <motion.div
            data-scope-view="workspace"
            data-scope-active={openSection === 'workspace'}
            className={
              openSection === 'workspace'
                ? 'min-h-0 flex-1 overflow-hidden'
                : 'shrink-0'
            }
            {...getScopeMotion('workspace')}
          >
            <WorkspaceSwitcher
              orgId={activeTeamId}
              workspaces={workspaces}
              activeWorkspaceId={selectedWorkspaceId}
              canManageOrganization={canManageOrganization}
              items={workspaceItems}
              unreadConversationIds={unreadConversationIds}
              onOpenCommandPalette={onOpenCommandPalette}
              open={openSection === 'workspace'}
              onOpenChange={(open) => handleSectionChange('workspace', open)}
            />
          </motion.div>
        ) : null}
      </SidebarContent>
      {/* Collapsed to icons, the scope sections have no room, so the open
          scope's entry points render as an icon rail instead. */}
      <SidebarContent className="hidden group-data-[collapsible=icon]:flex">
        {openSection === 'workspace' && selectedWorkspaceId ? (
          <NavCollapsed
            orgId={activeTeamId}
            workspaceId={selectedWorkspaceId}
            items={workspaceItems}
            unreadConversationIds={unreadConversationIds}
          />
        ) : (
          <NavCollapsed
            orgId={activeTeamId}
            items={data.organization}
            unreadConversationIds={unreadConversationIds}
          />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
