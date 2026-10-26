'use client';

import { ChevronRightIcon, type LucideIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@eos/shared/ui';
import { Link, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type NavOrganizationItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  subItems?: {
    title: string;
    url: string;
  }[];
};

type NavOrganizationItemsProps = {
  items: NavOrganizationItem[];
  /**
   * Open state of the enclosing section. Nested groups are folded away when
   * the section closes, so re-opening it never restores a half-expanded tree.
   */
  sectionOpen?: boolean;
};

export function NavOrganizationItems({
  items,
  sectionOpen,
}: NavOrganizationItemsProps) {
  const { t } = useTranslation('navigation');
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (sectionOpen === false) {
      setOpenGroups({});
    }
  }, [sectionOpen]);

  useEffect(() => {
    if (sectionOpen === false) {
      return;
    }

    const next: Record<string, boolean> = {};
    items.forEach((item) => {
      if (
        item.subItems?.some((subItem) =>
          location.pathname.includes(subItem.url),
        )
      ) {
        next[item.title] = true;
      }
    });
    setOpenGroups((prev) => ({ ...prev, ...next }));
  }, [items, location.pathname, sectionOpen]);

  return (
    <SidebarMenu fluidHover>
      {items.map((item) => {
        const isActive =
          location.pathname.includes(item.url) ||
          item.subItems?.some((subItem) =>
            location.pathname.includes(subItem.url),
          );
        const isExpandable = !!item.subItems?.length;

        return (
          <Collapsible
            key={item.title}
            asChild
            open={openGroups[item.title] ?? false}
            onOpenChange={(open) =>
              setOpenGroups((prev) => ({
                ...prev,
                [item.title]: open,
              }))
            }
          >
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
              >
                <Link to={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {isExpandable ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[panel-open]:rotate-90">
                      <ChevronRightIcon />
                      <span className="sr-only">{t('toggle')}</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.subItems?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location.pathname.includes(subItem.url)}
                          >
                            <Link to={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        );
      })}
    </SidebarMenu>
  );
}
