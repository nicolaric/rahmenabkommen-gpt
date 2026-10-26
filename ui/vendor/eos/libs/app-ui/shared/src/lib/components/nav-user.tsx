'use client';

import {
  Avatar,
  AvatarFallback,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@eos/shared/ui';
import {
  BadgeCheck,
  Bell,
  BookOpen,
  ChevronsUpDown,
  CircleHelp,
  LogOut,
  Settings2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useUnreadNotificationCount } from '../hooks/use-notifications';

export function NavUser({
  user,
}: {
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
    //avatar: string;
  };
}) {
  const { t, i18n } = useTranslation('navigation');
  const navigate = useNavigate();
  const { data: unreadData } = useUnreadNotificationCount();
  const { isMobile, state } = useSidebar();
  const displayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  const userInitials =
    `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    '?';
  const logout = () =>
    (window.location.href = `${import.meta.env.BASE_URL}logout`);
  const editProfile = () => navigate('/profile');
  const openNotifications = () => navigate('/notifications');
  const openNotificationPreferences = () =>
    navigate('/notification-preferences');
  const language = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split(
    '-',
  )[0];
  const unreadCount = unreadData?.unread_count ?? 0;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar
                className={`
                                    transition-all duration-300 ease-in-out ${state === 'collapsed' ? 'h-8 w-8' : 'h-10 w-10'} rounded-full
                              `}
              >
                <AvatarFallback className="rounded-full">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            {/**
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <Sparkles />
                                Upgrade to Pro
                            </DropdownMenuItem>
                        </DropdownMenuGroup>**/}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={editProfile}>
                <BadgeCheck />
                {t('profile')}
              </DropdownMenuItem>
              {/**<DropdownMenuItem>
                                <CreditCard />
                                Billing
                            </DropdownMenuItem>*/}
              <DropdownMenuItem onClick={openNotifications}>
                <Bell />
                <span>{t('notifications')}</span>
                {unreadCount > 0 ? (
                  <Badge
                    variant="default"
                    className="ml-auto h-5 min-w-5 justify-center px-1"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                ) : null}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openNotificationPreferences}>
                <Settings2 />
                {t('notificationSettings')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a
                  href={`https://yeos.ai/${language}/docs`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <BookOpen />
                  {t('documentation')}
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="mailto:support@yeos.ai">
                  <CircleHelp />
                  {t('help')}
                </a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
