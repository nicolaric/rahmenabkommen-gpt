'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { cn } from '@eos/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { PanelLeftIcon } from 'lucide-react';
import * as React from 'react';
import { Separator } from './separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './tooltip';
import { useFluidHover, useIsMobile } from '../hooks';
import { Button } from './button';
import { FluidHoverHighlight } from './fluid-hover-highlight';
import { Input } from './input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from './sheet';
import { Skeleton } from './skeleton';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

function renderAsChild<T extends React.ElementType>(
    tagName: T,
    asChild: boolean,
    children: React.ReactNode,
    props: Record<string, unknown>,
) {
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(
            children,
            mergeProps(
                children.props as React.ComponentPropsWithRef<T>,
                props as React.ComponentPropsWithRef<T>,
            ) as Partial<unknown> & React.Attributes,
        );
    }

    return React.createElement(tagName, props, children);
}

type SidebarContextProps = {
    state: 'expanded' | 'collapsed';
    open: boolean;
    setOpen: (open: boolean) => void;
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    isMobile: boolean;
    toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
    const context = React.useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider.');
    }

    return context;
}

function SidebarProvider({
    defaultOpen = true,
    open: openProp,
    onOpenChange: setOpenProp,
    className,
    style,
    children,
    ...props
}: React.ComponentProps<'div'> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
        (value: boolean | ((value: boolean) => boolean)) => {
            const openState = typeof value === 'function' ? value(open) : value;
            if (setOpenProp) {
                setOpenProp(openState);
            } else {
                _setOpen(openState);
            }

            // This sets the cookie to keep the sidebar state.
            document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        },
        [setOpenProp, open],
    );

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
        return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target;
            const isEditableTarget =
                target instanceof HTMLElement &&
                Boolean(
                    target.isContentEditable ||
                    target.closest('input, textarea, select, [contenteditable="true"]'),
                );

            if (isEditableTarget) return;

            if (
                event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
                (event.metaKey || event.ctrlKey) &&
                !event.altKey
            ) {
                event.preventDefault();
                toggleSidebar();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebar]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? 'expanded' : 'collapsed';

    const contextValue = React.useMemo<SidebarContextProps>(
        () => ({
            state,
            open,
            setOpen,
            isMobile,
            openMobile,
            setOpenMobile,
            toggleSidebar,
        }),
        [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
    );

    return (
        <SidebarContext.Provider value={contextValue}>
            <TooltipProvider delayDuration={0}>
                <div
                    data-slot="sidebar-wrapper"
                    style={
                        {
                            '--sidebar-width': SIDEBAR_WIDTH,
                            '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
                            ...style,
                        } as React.CSSProperties
                    }
                    className={cn(
                        'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
                        className,
                    )}
                    {...props}
                >
                    {children}
                </div>
            </TooltipProvider>
        </SidebarContext.Provider>
    );
}

function Sidebar({
    side = 'left',
    variant = 'sidebar',
    collapsible = 'offcanvas',
    className,
    children,
    ...props
}: React.ComponentProps<'div'> & {
    side?: 'left' | 'right';
    variant?: 'sidebar' | 'floating' | 'inset';
    collapsible?: 'offcanvas' | 'icon' | 'none';
}) {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === 'none') {
        return (
            <div
                data-slot="sidebar"
                className={cn(
                    'bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col',
                    className,
                )}
                {...props}
            >
                {children}
            </div>
        );
    }

    if (isMobile) {
        return (
            <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
                <SheetContent
                    data-sidebar="sidebar"
                    data-slot="sidebar"
                    data-mobile="true"
                    className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
                    style={
                        {
                            '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
                        } as React.CSSProperties
                    }
                    side={side}
                >
                    <SheetHeader className="sr-only">
                        <SheetTitle>Sidebar</SheetTitle>
                        <SheetDescription>Displays the mobile sidebar.</SheetDescription>
                    </SheetHeader>
                    <div className="flex h-full w-full flex-col">{children}</div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <div
            className="group peer text-sidebar-foreground hidden md:block"
            data-state={state}
            data-collapsible={state === 'collapsed' ? collapsible : ''}
            data-variant={variant}
            data-side={side}
            data-slot="sidebar"
        >
            {/* This is what handles the sidebar gap on desktop */}
            <div
                data-slot="sidebar-gap"
                className={cn(
                    'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
                    'group-data-[collapsible=offcanvas]:w-0',
                    'group-data-[side=right]:rotate-180',
                    variant === 'floating' || variant === 'inset'
                        ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
                        : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
                )}
            />
            <div
                data-slot="sidebar-container"
                className={cn(
                    'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex',
                    side === 'left'
                        ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
                        : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
                    variant === 'floating' || variant === 'inset'
                        ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
                        : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
                    // **add border width + color**
                    side === 'left' ? 'border-r' : 'border-l',
                    className,
                )}
                {...props}
            >
                <div
                    data-sidebar="sidebar"
                    data-slot="sidebar-inner"
                    className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

function SidebarTrigger({
    className,
    onClick,
    ...props
}: React.ComponentProps<typeof Button>) {
    const { toggleSidebar } = useSidebar();

    return (
        <Button
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            variant="ghost"
            size="icon"
            className={cn('size-7', className)}
            onClick={(event) => {
                onClick?.(event);
                toggleSidebar();
            }}
            {...props}
        >
            <PanelLeftIcon />
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
    );
}

function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
    const { toggleSidebar } = useSidebar();

    return (
        <button
            data-sidebar="rail"
            data-slot="sidebar-rail"
            aria-label="Toggle Sidebar"
            tabIndex={-1}
            onClick={toggleSidebar}
            title="Toggle Sidebar"
            className={cn(
                'hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex',
                'in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize',
                '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
                'hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full',
                '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
                '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
                className,
            )}
            {...props}
        />
    );
}

function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
    return (
        <main
            data-slot="sidebar-inset"
            className={cn(
                'bg-white relative flex min-w-0 flex-grow flex-col dark:bg-slate-950 overflow-x-hidden',
                'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
                className,
            )}
            {...props}
        />
    );
}

function SidebarInput({
    className,
    ...props
}: React.ComponentProps<typeof Input>) {
    return (
        <Input
            data-slot="sidebar-input"
            data-sidebar="input"
            className={cn(
                'bg-white h-8 w-full shadow-none dark:bg-slate-950',
                className,
            )}
            {...props}
        />
    );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="sidebar-header"
            data-sidebar="header"
            className={cn('flex flex-col gap-2 p-2', className)}
            {...props}
        />
    );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="sidebar-footer"
            data-sidebar="footer"
            className={cn('flex flex-col gap-2 p-2', className)}
            {...props}
        />
    );
}

function SidebarSeparator({
    className,
    ...props
}: React.ComponentProps<typeof Separator>) {
    return (
        <Separator
            data-slot="sidebar-separator"
            data-sidebar="separator"
            className={cn('bg-sidebar-border mx-2 w-auto', className)}
            {...props}
        />
    );
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="sidebar-content"
            data-sidebar="content"
            className={cn(
                'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
                className,
            )}
            {...props}
        />
    );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="sidebar-group"
            data-sidebar="group"
            className={cn(
                'relative flex w-full min-w-0 flex-col p-2 h-full',
                className,
            )}
            {...props}
        />
    );
}

function SidebarGroupLabel({
    className,
    asChild = false,
    children,
    ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
    return renderAsChild('div', asChild, children, {
        'data-slot': 'sidebar-group-label',
        'data-sidebar': 'group-label',
        className: cn(
            'text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
            'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
            className,
        ),
        ...props,
    });
}

function SidebarGroupAction({
    className,
    asChild = false,
    children,
    ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
    return renderAsChild('button', asChild, children, {
        'data-slot': 'sidebar-group-action',
        'data-sidebar': 'group-action',
        className: cn(
            'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
            // Increases the hit area of the button on mobile.
            'after:absolute after:-inset-2 md:after:hidden',
            'group-data-[collapsible=icon]:hidden',
            className,
        ),
        ...props,
    });
}

function SidebarGroupContent({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="sidebar-group-content"
            data-sidebar="group-content"
            className={cn('w-full text-sm', className)}
            {...props}
        />
    );
}

type FluidHoverRegistry = {
    /** Adds a row to the menu's fluid hover list; returns the removal. */
    register: (element: HTMLElement) => () => void;
};

const SidebarMenuFluidHoverContext =
    React.createContext<FluidHoverRegistry | null>(null);

const useIsoLayoutEffect =
    typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
    if (typeof ref === 'function') ref(value);
    else if (ref) ref.current = value;
}

function useMergedRefs<T>(
    a: React.Ref<T> | undefined,
    b: React.Ref<T> | undefined,
    c?: React.Ref<T>,
): React.RefCallback<T> {
    return React.useCallback(
        (value: T | null) => {
            assignRef(a, value);
            assignRef(b, value);
            assignRef(c, value);
        },
        [a, b, c],
    );
}

/**
 * Joins the enclosing fluid hover menu, if any, and reports whether it did so
 * the row can hand its hover fill to the shared highlight.
 */
function useSidebarFluidHoverItem(ref: React.RefObject<HTMLElement | null>) {
    const registry = React.useContext(SidebarMenuFluidHoverContext);
    useIsoLayoutEffect(() => {
        const element = ref.current;
        if (!registry || !element) return;
        return registry.register(element);
    }, [registry, ref]);
    return registry !== null;
}

const isFluidHoverItemDisabled = (element: HTMLElement) =>
    element.getAttribute('aria-disabled') === 'true' ||
    (element as HTMLButtonElement).disabled === true;

/**
 * Backs `<SidebarMenu fluidHover>`: one highlight that glides to the row
 * nearest the pointer instead of every row toggling its own `:hover` fill.
 *
 * Rows register themselves rather than being counted from `children`, so
 * buttons nested in wrappers (collapsibles, tooltips) and sub-menu rows all
 * join the one list. Their hook indices follow DOM order and are rebuilt,
 * coalesced, whenever a row mounts or unmounts.
 */
function useSidebarFluidHover(
    containerRef: React.RefObject<HTMLUListElement | null>,
) {
    const hover = useFluidHover(containerRef, {
        isItemDisabled: isFluidHoverItemDisabled,
    });
    const { registerItem } = hover;
    const elementsRef = React.useRef(new Set<HTMLElement>());
    const indexedRef = React.useRef<HTMLElement[]>([]);
    const syncQueuedRef = React.useRef(false);

    const registry = React.useMemo<FluidHoverRegistry>(() => {
        const sync = () => {
            syncQueuedRef.current = false;
            const next = [...elementsRef.current].sort((a, b) =>
                a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
                    ? -1
                    : 1,
            );
            const previous = indexedRef.current;
            const length = Math.max(previous.length, next.length);
            for (let index = 0; index < length; index++) {
                if (previous[index] === next[index]) continue;
                if (previous[index]) registerItem(index, null);
                if (next[index]) registerItem(index, next[index]);
            }
            indexedRef.current = next;
        };
        const queueSync = () => {
            if (syncQueuedRef.current) return;
            syncQueuedRef.current = true;
            queueMicrotask(sync);
        };
        return {
            register: (element) => {
                elementsRef.current.add(element);
                queueSync();
                return () => {
                    elementsRef.current.delete(element);
                    queueSync();
                };
            },
        };
    }, [registerItem]);

    return { hover, registry };
}

function SidebarMenu({
    className,
    fluidHover = false,
    children,
    ...props
}: React.ComponentProps<'ul'> & {
    /**
     * Replaces each row's own hover fill with one highlight that follows the
     * pointer to the nearest row. Only for menus where every row is a click
     * target; a menu nested inside another fluid menu should not opt in.
     */
    fluidHover?: boolean;
}) {
    if (fluidHover) {
        return (
            <FluidHoverSidebarMenu className={className} {...props}>
                {children}
            </FluidHoverSidebarMenu>
        );
    }
    return (
        <ul
            data-slot="sidebar-menu"
            data-sidebar="menu"
            className={cn('flex w-full min-w-0 flex-col gap-1', className)}
            {...props}
        >
            {children}
        </ul>
    );
}

function FluidHoverSidebarMenu({
    className,
    children,
    ref,
    ...props
}: React.ComponentProps<'ul'>) {
    const containerRef = React.useRef<HTMLUListElement>(null);
    const mergedRef = useMergedRefs(containerRef, ref);
    const { hover, registry } = useSidebarFluidHover(containerRef);
    return (
        <ul
            ref={mergedRef}
            data-slot="sidebar-menu"
            data-sidebar="menu"
            data-fluid-hover=""
            className={cn('relative flex w-full min-w-0 flex-col gap-1', className)}
            {...props}
            {...hover.handlers}
        >
            <FluidHoverHighlight
                as="li"
                hover={hover}
                className="bg-sidebar-accent rounded-md"
            />
            <SidebarMenuFluidHoverContext.Provider value={registry}>
                {children}
            </SidebarMenuFluidHoverContext.Provider>
        </ul>
    );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
    return (
        <li
            data-slot="sidebar-menu-item"
            data-sidebar="menu-item"
            className={cn('group/menu-item relative', className)}
            {...props}
        />
    );
}

const sidebarMenuButtonVariants = cva(
    'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
    {
        variants: {
            variant: {
                default: '',
                outline:
                    'bg-white shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)] dark:bg-slate-950',
            },
            size: {
                default: 'h-8 text-sm',
                sm: 'h-7 text-xs',
                lg: 'h-12 text-sm group-data-[collapsible=icon]:p-0!',
            },
            // In a fluid hover menu the shared highlight draws the hover fill;
            // the row only takes the hover text colour while it is lit.
            fluidHover: {
                false: '',
                true: '',
            },
        },
        compoundVariants: [
            {
                variant: 'default',
                fluidHover: false,
                className:
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            },
            {
                variant: 'default',
                fluidHover: true,
                className:
                    'data-fluid-hover-active:text-sidebar-accent-foreground',
            },
        ],
        defaultVariants: {
            variant: 'default',
            size: 'default',
            fluidHover: false,
        },
    },
);

const SidebarMenuButton = React.forwardRef<
    HTMLButtonElement,
    React.ComponentProps<'button'> & {
        asChild?: boolean;
        isActive?: boolean;
        tooltip?: string | React.ComponentProps<typeof TooltipContent>;
    } & Omit<VariantProps<typeof sidebarMenuButtonVariants>, 'fluidHover'>
>(
    (
        {
            asChild = false,
            isActive = false,
            variant = 'default',
            size = 'default',
            tooltip,
            className,
            children,
            ...props
        },
        ref,
    ) => {
        const { isMobile, state } = useSidebar();
        const elementRef = React.useRef<HTMLElement>(null);
        const fluidHover = useSidebarFluidHoverItem(elementRef);
        const childRef =
            asChild && React.isValidElement(children)
                ? (children.props as { ref?: React.Ref<HTMLElement> }).ref
                : undefined;
        const mergedRef = useMergedRefs<HTMLElement>(
            childRef,
            ref as React.Ref<HTMLElement>,
            elementRef,
        );

        const buttonProps = {
            'data-slot': 'sidebar-menu-button',
            'data-sidebar': 'menu-button',
            'data-size': size,
            'data-active': isActive,
            className: cn(
                sidebarMenuButtonVariants({ variant, size, fluidHover }),
                className,
            ),
            ...props,
        } as React.ComponentProps<'button'>;

        const button =
            asChild && React.isValidElement(children) ? (
                React.cloneElement(children, {
                    ...(mergeProps(
                        children.props as React.ComponentProps<'button'>,
                        buttonProps,
                    ) as Partial<unknown> & React.Attributes),
                    ref: mergedRef,
                } as Partial<unknown> & React.Attributes)
            ) : (
                <button ref={mergedRef} {...buttonProps}>
                    {children}
                </button>
            );

        if (!tooltip) {
            return button;
        }

        if (typeof tooltip === 'string') {
            tooltip = {
                children: tooltip,
            };
        }

        return (
            <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent
                    side="right"
                    align="center"
                    hidden={state !== 'collapsed' || isMobile}
                    {...tooltip}
                />
            </Tooltip>
        );
    },
);

const SidebarMenuAction = React.forwardRef<
    HTMLButtonElement,
    React.ComponentProps<'button'> & {
        asChild?: boolean;
        showOnHover?: boolean;
    }
>(
    (
        { className, asChild = false, showOnHover = false, children, ...props },
        ref,
    ) => {
        const buttonProps = {
            'data-slot': 'sidebar-menu-action',
            'data-sidebar': 'menu-action',
            className: cn(
                'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
                // Increases the hit area of the button on mobile.
                'after:absolute after:-inset-2 md:after:hidden',
                // Each offset centres the 20px action in its row height: h-7, h-8
                // and h-12 respectively.
                'peer-data-[size=sm]/menu-button:top-1',
                'peer-data-[size=default]/menu-button:top-1.5',
                'peer-data-[size=lg]/menu-button:top-3.5',
                'group-data-[collapsible=icon]:hidden',
                showOnHover &&
                'peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-popup-open:opacity-100 md:opacity-0',
                className,
            ),
            ...props,
        } as React.ComponentProps<'button'>;

        if (asChild && React.isValidElement(children)) {
            return React.cloneElement(
                children,
                mergeProps(
                    children.props as React.ComponentProps<'button'>,
                    buttonProps,
                ) as Partial<unknown> & React.Attributes,
            );
        }

        return (
            <button ref={ref} {...buttonProps}>
                {children}
            </button>
        );
    },
);

function SidebarMenuBadge({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="sidebar-menu-badge"
            data-sidebar="menu-badge"
            className={cn(
                'text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none',
                'peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
                'peer-data-[size=sm]/menu-button:top-1',
                'peer-data-[size=default]/menu-button:top-1.5',
                'peer-data-[size=lg]/menu-button:top-2.5',
                'group-data-[collapsible=icon]:hidden',
                className,
            )}
            {...props}
        />
    );
}

function SidebarMenuSkeleton({
    className,
    showIcon = false,
    ...props
}: React.ComponentProps<'div'> & {
    showIcon?: boolean;
}) {
    const width = '75%';

    return (
        <div
            data-slot="sidebar-menu-skeleton"
            data-sidebar="menu-skeleton"
            className={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
            {...props}
        >
            {showIcon && (
                <Skeleton
                    className="size-4 rounded-md"
                    data-sidebar="menu-skeleton-icon"
                />
            )}
            <Skeleton
                className="h-4 max-w-(--skeleton-width) flex-1"
                data-sidebar="menu-skeleton-text"
                style={
                    {
                        '--skeleton-width': width,
                    } as React.CSSProperties
                }
            />
        </div>
    );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
    return (
        <ul
            data-slot="sidebar-menu-sub"
            data-sidebar="menu-sub"
            className={cn(
                'border-sidebar-border ml-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5',
                'group-data-[collapsible=icon]:hidden',
                className,
            )}
            {...props}
        />
    );
}

function SidebarMenuSubItem({
    className,
    ...props
}: React.ComponentProps<'li'>) {
    return (
        <li
            data-slot="sidebar-menu-sub-item"
            data-sidebar="menu-sub-item"
            className={cn('group/menu-sub-item relative', className)}
            {...props}
        />
    );
}

function SidebarMenuSubButton({
    asChild = false,
    size = 'md',
    isActive = false,
    className,
    children,
    ref,
    ...props
}: React.ComponentProps<'a'> & {
    asChild?: boolean;
    size?: 'sm' | 'md';
    isActive?: boolean;
}) {
    const elementRef = React.useRef<HTMLElement>(null);
    const fluidHover = useSidebarFluidHoverItem(elementRef);
    const childRef =
        asChild && React.isValidElement(children)
            ? (children.props as { ref?: React.Ref<HTMLElement> }).ref
            : undefined;
    const mergedRef = useMergedRefs<HTMLElement>(
        childRef,
        ref as React.Ref<HTMLElement>,
        elementRef,
    );
    return renderAsChild('a', asChild, children, {
        ref: mergedRef,
        'data-slot': 'sidebar-menu-sub-button',
        'data-sidebar': 'menu-sub-button',
        'data-size': size,
        'data-active': isActive,
        className: cn(
            fluidHover
                ? 'data-fluid-hover-active:text-sidebar-accent-foreground'
                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            'text-sidebar-foreground ring-sidebar-ring active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
            'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            'group-data-[collapsible=icon]:hidden',
            className,
        ),
        ...props,
    });
}

export {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarInset,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
    useSidebar,
};
