'use client';

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldLabel,
  Input,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@eos/shared/ui';
import { ChevronsUpDown, Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useFetcher, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { organizationLogoUrl } from '@eos/data-access/api';
import { cn } from '@eos/utils';
import { buildNewConversationPath } from '../routing';
import { useConversations } from '../hooks/use-conversations';
import { NavMain } from './nav-main';
import { NavScopeActions } from './nav-scope-actions';
import {
  NavOrganizationItems,
  type NavOrganizationItem,
} from './nav-organization';

export type OrganizationSwitcherTeam = {
  id: string;
  name: string;
  plan: string;
  logo_content_hash?: string | null;
  features?: Record<string, boolean>;
};

type OrganizationSwitcherProps = {
  teams: OrganizationSwitcherTeam[];
  activeTeamId: string;
  items?: NavOrganizationItem[];
  unreadConversationIds?: Set<string>;
  onOpenCommandPalette?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Whether the section can be folded away. With no workspace section below it
   * the organization owns the whole sidebar, so collapsing it would only leave
   * an empty column - the header then stays a plain label.
   */
  collapsible?: boolean;
};

/** Keeps the header a toggle only while the section can actually fold. */
function OrganizationHeaderTrigger({
  collapsible,
  children,
}: {
  collapsible: boolean;
  children: ReactElement;
}) {
  if (!collapsible) return children;
  return <CollapsibleTrigger asChild>{children}</CollapsibleTrigger>;
}

export function OrganizationSwitcher({
  teams,
  activeTeamId,
  items = [],
  unreadConversationIds,
  onOpenCommandPalette,
  open,
  onOpenChange,
  collapsible = true,
}: OrganizationSwitcherProps) {
  const { t } = useTranslation('navigation');
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const { isMobile } = useSidebar();
  const [createOrganizationDialogOpen, setCreateOrganizationDialogOpen] =
    useState(false);
  const [organizationMenuOpen, setOrganizationMenuOpen] = useState(false);
  const [internalOpen, setInternalOpen] = useState(true);
  const createOrganizationFetcher = useFetcher();
  const isSubmitting = createOrganizationFetcher.state !== 'idle';

  const activeTeam = teams.find((team) => team.id === activeTeamId);
  const sortedTeams = [...teams].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
  // A stored logo is retained when an organization loses the entitlement, so
  // both conditions are required before it is rendered.
  const customLogoUrl =
    activeTeam?.features?.['custom_logo'] && activeTeam.logo_content_hash
      ? organizationLogoUrl(activeTeam.id, activeTeam.logo_content_hash)
      : null;
  const isSectionOpen = collapsible ? (open ?? internalOpen) : true;
  // Scoped to the organization itself: passing no workspace id asks the API
  // for the conversations that live outside every workspace. Gating on the
  // open state keeps the collapsed section from fetching a list nobody sees.
  const {
    data: conversationsData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useConversations(isSectionOpen ? activeTeamId : undefined);
  const conversations = conversationsData?.data ?? [];
  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const getNewPath = (newOrgId: string) => {
    const segments = location.pathname.split('/').filter(Boolean);
    const orgSegmentIndex = segments[0] === 'app' ? 1 : 0;
    const currentSegment = segments[orgSegmentIndex];
    const routeSegmentAfterOrg = segments[orgSegmentIndex + 1];

    if (currentSegment === 'profile') {
      return `/${newOrgId}/profile`;
    }

    if (routeSegmentAfterOrg === 'workspaces') {
      return buildNewConversationPath({ orgId: newOrgId });
    }

    if (!teams.some((team) => team.id === currentSegment)) {
      return buildNewConversationPath({ orgId: newOrgId });
    }

    if (routeSegmentAfterOrg === 'conversations') {
      return buildNewConversationPath({ orgId: newOrgId });
    }

    segments[orgSegmentIndex] = newOrgId;
    return `/${segments.join('/')}`;
  };

  useEffect(() => {
    if (
      createOrganizationFetcher.state !== 'idle' ||
      !createOrganizationFetcher.data
    ) {
      return;
    }

    const result = createOrganizationFetcher.data as
      | { errors: { form?: string } }
      | { organization: { id: string } };

    if ('errors' in result) {
      toast.error(result.errors.form ?? t('createOrganization.error'));
      return;
    }

    if (result.organization?.id) {
      setCreateOrganizationDialogOpen(false);
      setOrganizationMenuOpen(false);
      navigate(buildNewConversationPath({ orgId: result.organization.id }));
    }
  }, [
    createOrganizationFetcher.state,
    createOrganizationFetcher.data,
    navigate,
    t,
  ]);

  return (
    <Dialog
      open={createOrganizationDialogOpen}
      onOpenChange={setCreateOrganizationDialogOpen}
    >
      <Collapsible open={isSectionOpen} onOpenChange={handleOpenChange} asChild>
        <SidebarGroup
          className={cn(
            isSectionOpen && 'min-h-0 flex-1',
            // Collapsed, the section closes up against what follows it, but it
            // keeps its top padding so the org row does not sit flush against
            // the top of the sidebar.
            !isSectionOpen && 'pb-0',
          )}
        >
          <SidebarMenu className="min-h-0 flex-1">
            <SidebarMenuItem className="flex min-h-0 flex-1 flex-col">
              <OrganizationHeaderTrigger collapsible={collapsible}>
                <SidebarMenuButton
                  size="lg"
                  className={cn(
                    'px-0',
                    !collapsible && 'cursor-default hover:bg-transparent',
                  )}
                >
                  <div className="bg-gray-100 flex aspect-square size-8 items-center justify-center rounded-lg p-2">
                    {/*
                      The tile backdrop is a fixed light gray in both themes, so
                      one uploaded logo is legible in light and dark alike and no
                      per-theme variant is needed.
                    */}
                    <img
                      src={
                        customLogoUrl ??
                        `${import.meta.env.VITE_LOCAL ? '' : '/app'}/img/logo-short.svg`
                      }
                      alt="Logo"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {activeTeam?.name ?? t('organization')}
                    </span>
                    {activeTeam?.plan && (
                      <span className="truncate text-xs">
                        {activeTeam.plan}
                      </span>
                    )}
                  </div>
                </SidebarMenuButton>
              </OrganizationHeaderTrigger>
              <DropdownMenu
                open={organizationMenuOpen}
                onOpenChange={setOrganizationMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction>
                    <ChevronsUpDown className="size-4" />
                    <span className="sr-only">{t('teams')}</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  align="start"
                  side={isMobile ? 'bottom' : 'right'}
                >
                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                    {t('teams')}
                  </DropdownMenuLabel>
                  {sortedTeams.map((team) => (
                    <DropdownMenuItem
                      key={team.id}
                      asChild
                      className="gap-2 p-2"
                    >
                      <NavLink to={getNewPath(team.id)}>
                        <div
                          className={`flex size-6 items-center justify-center rounded-md border ${team.id === activeTeamId ? 'bg-primary' : ''}`}
                        />
                        <span className="truncate">{team.name}</span>
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DialogTrigger asChild>
                    <DropdownMenuItem className="gap-2 p-2">
                      <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                        <Plus className="size-4" />
                      </div>
                      <div className="font-medium text-muted-foreground">
                        {t('addTeam')}
                      </div>
                    </DropdownMenuItem>
                  </DialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <CollapsibleContent className="min-h-0 flex-1 overflow-hidden">
                <motion.div
                  data-scope-content="organization"
                  initial={
                    prefersReducedMotion ? false : { opacity: 0, y: -20 }
                  }
                  animate={
                    isSectionOpen || prefersReducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: -20 }
                  }
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.28,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex h-full min-h-0 flex-col"
                >
                  <NavScopeActions
                    orgId={activeTeamId}
                    onOpenCommandPalette={onOpenCommandPalette}
                  />
                  <NavOrganizationItems
                    items={items}
                    sectionOpen={isSectionOpen}
                  />
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y">
                    <NavMain
                      conversations={conversations}
                      unreadConversationIds={unreadConversationIds}
                      activeTeamId={activeTeamId}
                      hasMore={Boolean(hasNextPage)}
                      isLoadingMore={isFetchingNextPage}
                      onLoadMore={() => void fetchNextPage()}
                    />
                  </div>
                </motion.div>
              </CollapsibleContent>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </Collapsible>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('createTeamTitle')}</DialogTitle>
          <DialogDescription>{t('createTeamDesc')}</DialogDescription>
        </DialogHeader>
        <createOrganizationFetcher.Form
          method="post"
          action="/action/create-organization"
        >
          <div className="space-y-4 py-4">
            <Field>
              <FieldLabel htmlFor="name">
                {t('createOrganization.name')}
              </FieldLabel>
              <Input
                id="name"
                name="name"
                required
                placeholder={t('createOrganization.namePlaceholder')}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">
                {t('createOrganization.descriptionLabel')}
              </FieldLabel>
              <Input
                id="description"
                name="description"
                placeholder={t('createOrganization.descriptionPlaceholder')}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? t('createOrganization.submitting')
                : t('createOrganization.submit')}
            </Button>
          </div>
        </createOrganizationFetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
