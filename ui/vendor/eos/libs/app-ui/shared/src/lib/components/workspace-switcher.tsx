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
import { BriefcaseBusiness, ChevronsUpDown, Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@eos/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { buildDocumentsPath, buildNewConversationPath } from '../routing';
import { useConversations } from '../hooks/use-conversations';
import { NavMain } from './nav-main';
import { NavScopeActions } from './nav-scope-actions';
import {
  NavOrganizationItems,
  type NavOrganizationItem,
} from './nav-organization';

type WorkspaceSwitcherProps = {
  orgId: string;
  workspaces: { id: string; name: string; is_disabled?: boolean }[];
  activeWorkspaceId?: string;
  canManageOrganization: boolean;
  items?: NavOrganizationItem[];
  unreadConversationIds?: Set<string>;
  onOpenCommandPalette?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function WorkspaceSwitcher({
  orgId,
  workspaces,
  activeWorkspaceId,
  canManageOrganization,
  items = [],
  unreadConversationIds,
  onOpenCommandPalette,
  open,
  onOpenChange,
}: WorkspaceSwitcherProps) {
  const { t } = useTranslation('navigation');
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { isMobile } = useSidebar();
  const [createWorkspaceDialogOpen, setCreateWorkspaceDialogOpen] =
    useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
    workspaces.find(
      (workspace) => !workspace.is_disabled || canManageOrganization,
    ) ??
    workspaces[0];
  const isSectionOpen = open ?? internalOpen;
  // Only the conversations that belong to this workspace. Gated on the open
  // state so a collapsed section does not fetch a list nobody sees.
  const {
    data: conversationsData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useConversations(
    isSectionOpen && activeWorkspace ? orgId : undefined,
    activeWorkspace?.id,
  );
  const conversations = conversationsData?.data ?? [];
  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const getNewPath = (workspaceId: string) => {
    const isWorkspaceDocumentsRoute =
      /^\/(?:app\/)?[^/]+\/workspaces\/[^/]+\/documents(?:\/|$)/.test(
        location.pathname,
      );
    const isDocumentsRoute = /^\/(?:app\/)?[^/]+\/documents(?:\/|$)/.test(
      location.pathname,
    );

    if (isWorkspaceDocumentsRoute || isDocumentsRoute) {
      return buildDocumentsPath({ orgId, workspaceId });
    }

    return buildNewConversationPath({ orgId, workspaceId });
  };

  useEffect(() => {
    const openWorkspaceSwitcher = () => {
      setWorkspaceMenuOpen(true);
    };

    window.addEventListener(
      'eos:open-workspace-switcher',
      openWorkspaceSwitcher,
    );

    return () => {
      window.removeEventListener(
        'eos:open-workspace-switcher',
        openWorkspaceSwitcher,
      );
    };
  }, []);

  return (
    <Dialog
      open={createWorkspaceDialogOpen}
      onOpenChange={setCreateWorkspaceDialogOpen}
    >
      <Collapsible open={isSectionOpen} onOpenChange={handleOpenChange} asChild>
        <SidebarGroup
          className={cn('px-2 pb-2 pt-0', isSectionOpen && 'min-h-0 flex-1')}
        >
          <SidebarMenu className="min-h-0 flex-1">
            <SidebarMenuItem className="flex min-h-0 flex-1 flex-col">
              <CollapsibleTrigger asChild>
                {/* Deliberately identical to the organization trigger, so the
                    two scopes read as the same kind of thing — only the tile
                    differs, an icon here where the organization has its logo. */}
                <SidebarMenuButton size="lg" className="px-0">
                  <div className="bg-gray-100 flex aspect-square size-8 items-center justify-center rounded-lg p-2">
                    <BriefcaseBusiness className="size-4 text-gray-700" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {activeWorkspace?.name ?? t('workspace')}
                    </span>
                    <span className="truncate text-xs">{t('workspace')}</span>
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <DropdownMenu
                open={workspaceMenuOpen}
                onOpenChange={setWorkspaceMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction>
                    <ChevronsUpDown className="size-4" />
                    <span className="sr-only">{t('workspaces')}</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  align="start"
                  side={isMobile ? 'bottom' : 'right'}
                >
                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                    {t('workspaces')}
                  </DropdownMenuLabel>
                  {workspaces.map((workspace) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      asChild
                      className="gap-2 p-2"
                      disabled={workspace.is_disabled && !canManageOrganization}
                    >
                      <NavLink to={getNewPath(workspace.id)}>
                        <div
                          className={`flex size-6 items-center justify-center rounded-md border ${workspace.id === activeWorkspace?.id ? 'bg-primary' : ''}`}
                        />
                        <span
                          className={
                            workspace.is_disabled ? 'text-muted-foreground' : ''
                          }
                        >
                          {workspace.name}
                        </span>
                        {workspace.is_disabled && (
                          <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                            {t('disabled')}
                          </span>
                        )}
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                  {canManageOrganization && (
                    <>
                      <DropdownMenuSeparator />
                      <DialogTrigger asChild>
                        <DropdownMenuItem className="gap-2 p-2">
                          <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                            <Plus className="size-4" />
                          </div>
                          <div className="font-medium text-muted-foreground">
                            {t('addWorkspace')}
                          </div>
                        </DropdownMenuItem>
                      </DialogTrigger>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <CollapsibleContent className="min-h-0 flex-1 overflow-hidden">
                <motion.div
                  data-scope-content="workspace"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  animate={
                    isSectionOpen || prefersReducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 20 }
                  }
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.28,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex h-full min-h-0 flex-col"
                >
                  <NavScopeActions
                    orgId={orgId}
                    workspaceId={activeWorkspace?.id}
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
                      activeTeamId={orgId}
                      activeWorkspaceId={activeWorkspace?.id}
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
          <DialogTitle>{t('createWorkspaceTitle')}</DialogTitle>
          <DialogDescription>{t('createWorkspaceDesc')}</DialogDescription>
        </DialogHeader>
        <form
          method="post"
          onSubmit={async (event) => {
            event.preventDefault();
            if (isSubmitting) return;
            if (!canManageOrganization) return;

            const formData = new FormData(event.currentTarget);
            const name = String(formData.get('name') || '').trim();
            const description = String(
              formData.get('description') || '',
            ).trim();

            if (!name) {
              toast.error(t('createWorkspace.error'));
              return;
            }

            const apiBaseUrl = import.meta.env.VITE_API_URL;
            const workspaceUrl = new URL(
              'workspaces',
              apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`,
            );
            workspaceUrl.search = new URLSearchParams({
              organizationId: orgId,
            }).toString();

            setIsSubmitting(true);
            try {
              const response = await fetch(workspaceUrl.toString(), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  name,
                  description: description || null,
                }),
              });

              if (!response.ok) {
                throw new Error('Create workspace failed');
              }

              const newWorkspace = await response.json();
              setCreateWorkspaceDialogOpen(false);
              navigate(getNewPath(newWorkspace.id));
            } catch {
              toast.error(t('createWorkspace.error'));
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="space-y-4 py-4">
            <Field>
              <FieldLabel htmlFor="name">
                {t('createWorkspace.name')}
              </FieldLabel>
              <Input
                id="name"
                name="name"
                minLength={1}
                maxLength={100}
                required
                placeholder={t('createWorkspace.namePlaceholder')}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">
                {t('createWorkspace.descriptionLabel')}
              </FieldLabel>
              <Input
                id="description"
                name="description"
                placeholder={t('createWorkspace.descriptionPlaceholder')}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? t('createWorkspace.submitting')
                : t('createWorkspace.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
