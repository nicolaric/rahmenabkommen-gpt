import { Menu as DropdownMenuPrimitive } from '@base-ui/react/menu';
import { cn } from '@eos/utils';
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react';
import * as React from 'react';

type WithAsChild<T> = T & { asChild?: boolean };

function renderFromAsChild(
    asChild: boolean | undefined,
    children: React.ReactNode,
    render: unknown,
) {
    if (asChild && React.isValidElement(children)) {
        return children;
    }
    return render as never;
}

function DropdownMenu({
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
    return <DropdownMenuPrimitive.Root {...props} />;
}

function DropdownMenuPortal({
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
    return (
        <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
    );
}

function DropdownMenuTrigger({
    asChild,
    render,
    children,
    ...props
}: WithAsChild<React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>>) {
    return (
        <DropdownMenuPrimitive.Trigger
            data-slot="dropdown-menu-trigger"
            render={renderFromAsChild(asChild, children, render)}
            {...props}
        >
            {asChild ? undefined : children}
        </DropdownMenuPrimitive.Trigger>
    );
}

type DropdownMenuContentProps = React.ComponentProps<
    typeof DropdownMenuPrimitive.Popup
> &
    Pick<
        React.ComponentProps<typeof DropdownMenuPrimitive.Positioner>,
        'align' | 'alignOffset' | 'side' | 'sideOffset'
    >;

function DropdownMenuContent({
    className,
    sideOffset = 4,
    align,
    alignOffset,
    side,
    ...props
}: DropdownMenuContentProps) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Positioner
                align={align}
                alignOffset={alignOffset}
                side={side}
                sideOffset={sideOffset}
                className="isolate z-50 outline-none"
            >
                <DropdownMenuPrimitive.Popup
                    data-slot="dropdown-menu-content"
                    className={cn(
                        'bg-white text-slate-950 data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--available-height) min-w-[8rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-slate-200 p-1 shadow-md outline-none dark:bg-slate-950 dark:text-slate-50 dark:border-slate-800',
                        className,
                    )}
                    {...props}
                />
            </DropdownMenuPrimitive.Positioner>
        </DropdownMenuPrimitive.Portal>
    );
}

function DropdownMenuGroup({
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
    return (
        <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
    );
}

type DropdownMenuItemProps = WithAsChild<
    Omit<React.ComponentProps<typeof DropdownMenuPrimitive.Item>, 'onSelect'>
> & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
    /**
     * Radix-compatible selection handler. Base UI menu items use click events,
     * while this codebase still has Radix-style onSelect call sites.
     */
    onSelect?: (event: React.MouseEvent<HTMLElement>) => void;
};

function DropdownMenuItem({
    className,
    inset,
    variant = 'default',
    asChild,
    render,
    children,
    onClick,
    onSelect,
    ...props
}: DropdownMenuItemProps) {
    return (
        <DropdownMenuPrimitive.Item
            data-slot="dropdown-menu-item"
            data-inset={inset}
            data-variant={variant}
            render={renderFromAsChild(asChild, children, render)}
            className={cn(
                'focus:bg-slate-100 focus:text-slate-900 data-[variant=destructive]:text-red-500 data-[variant=destructive]:focus:bg-red-500/10 dark:data-[variant=destructive]:focus:bg-red-500/20 data-[variant=destructive]:focus:text-red-500 data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*="text-"])]:text-slate-500 relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 dark:focus:bg-slate-800 dark:focus:text-slate-50 dark:data-[variant=destructive]:text-red-900 dark:data-[variant=destructive]:focus:bg-red-900/10 dark:dark:data-[variant=destructive]:focus:bg-red-900/20 dark:data-[variant=destructive]:focus:text-red-900 dark:[&_svg:not([class*="text-"])]:text-slate-400',
                className,
            )}
            onClick={(event) => {
                onClick?.(event);
                if (!event.defaultPrevented) {
                    onSelect?.(event);
                }
            }}
            {...props}
        >
            {asChild ? undefined : children}
        </DropdownMenuPrimitive.Item>
    );
}

function DropdownMenuCheckboxItem({
    className,
    children,
    checked,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
    return (
        <DropdownMenuPrimitive.CheckboxItem
            data-slot="dropdown-menu-checkbox-item"
            className={cn(
                'focus:bg-slate-100 focus:text-slate-900 relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 dark:focus:bg-slate-800 dark:focus:text-slate-50',
                className,
            )}
            checked={checked}
            {...props}
        >
            <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.CheckboxItemIndicator>
                    <CheckIcon className="size-4" />
                </DropdownMenuPrimitive.CheckboxItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    );
}

function DropdownMenuRadioGroup({
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
    return (
        <DropdownMenuPrimitive.RadioGroup
            data-slot="dropdown-menu-radio-group"
            {...props}
        />
    );
}

function DropdownMenuRadioItem({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
    return (
        <DropdownMenuPrimitive.RadioItem
            data-slot="dropdown-menu-radio-item"
            className={cn(
                'focus:bg-slate-100 focus:text-slate-900 relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 dark:focus:bg-slate-800 dark:focus:text-slate-50',
                className,
            )}
            {...props}
        >
            <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.RadioItemIndicator>
                    <CircleIcon className="size-2 fill-current" />
                </DropdownMenuPrimitive.RadioItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.RadioItem>
    );
}

function DropdownMenuLabel({
    className,
    inset,
    ...props
}: React.ComponentProps<'div'> & {
    inset?: boolean;
}) {
    return (
        <div
            data-slot="dropdown-menu-label"
            data-inset={inset}
            className={cn(
                'px-2 py-1.5 text-sm font-medium data-[inset]:pl-8',
                className,
            )}
            {...props}
        />
    );
}

function DropdownMenuSeparator({
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
    return (
        <DropdownMenuPrimitive.Separator
            data-slot="dropdown-menu-separator"
            className={cn('bg-slate-200 -mx-1 my-1 h-px dark:bg-slate-800', className)}
            {...props}
        />
    );
}

function DropdownMenuShortcut({
    className,
    ...props
}: React.ComponentProps<'span'>) {
    return (
        <span
            data-slot="dropdown-menu-shortcut"
            className={cn(
                'text-slate-500 ml-auto text-xs tracking-widest dark:text-slate-400',
                className,
            )}
            {...props}
        />
    );
}

function DropdownMenuSub({
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubmenuRoot>) {
    return <DropdownMenuPrimitive.SubmenuRoot {...props} />;
}

function DropdownMenuSubTrigger({
    className,
    inset,
    children,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubmenuTrigger> & {
    inset?: boolean;
}) {
    return (
        <DropdownMenuPrimitive.SubmenuTrigger
            data-slot="dropdown-menu-sub-trigger"
            data-inset={inset}
            className={cn(
                'focus:bg-slate-100 focus:text-slate-900 data-popup-open:bg-slate-100 data-popup-open:text-slate-900 [&_svg:not([class*="text-"])]:text-slate-500 flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 dark:focus:bg-slate-800 dark:focus:text-slate-50 dark:data-popup-open:bg-slate-800 dark:data-popup-open:text-slate-50 dark:[&_svg:not([class*="text-"])]:text-slate-400',
                className,
            )}
            {...props}
        >
            {children}
            <ChevronRightIcon className="ml-auto size-4" />
        </DropdownMenuPrimitive.SubmenuTrigger>
    );
}

function DropdownMenuSubContent({
    className,
    side = 'right',
    align = 'start',
    alignOffset = -3,
    sideOffset = 0,
    ...props
}: DropdownMenuContentProps) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Positioner
                side={side}
                align={align}
                alignOffset={alignOffset}
                sideOffset={sideOffset}
                className="isolate z-50 outline-none"
            >
                <DropdownMenuPrimitive.Popup
                    data-slot="dropdown-menu-sub-content"
                    className={cn(
                        'bg-white text-slate-950 data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--transform-origin) overflow-hidden rounded-md border border-slate-200 p-1 shadow-lg outline-none dark:bg-slate-950 dark:text-slate-50 dark:border-slate-800',
                        className,
                    )}
                    {...props}
                />
            </DropdownMenuPrimitive.Positioner>
        </DropdownMenuPrimitive.Portal>
    );
}

export {
    DropdownMenu,
    DropdownMenuPortal,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
};
