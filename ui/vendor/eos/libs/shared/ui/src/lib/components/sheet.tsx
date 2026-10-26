'use client';

import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { cn } from '@eos/utils';
import { XIcon } from 'lucide-react';
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

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
    return <SheetPrimitive.Root {...props} />;
}

function SheetTrigger({
    asChild,
    render,
    children,
    ...props
}: WithAsChild<React.ComponentProps<typeof SheetPrimitive.Trigger>>) {
    return (
        <SheetPrimitive.Trigger
            data-slot="sheet-trigger"
            render={renderFromAsChild(asChild, children, render)}
            {...props}
        >
            {asChild ? undefined : children}
        </SheetPrimitive.Trigger>
    );
}

function SheetClose({
    asChild,
    render,
    children,
    ...props
}: WithAsChild<React.ComponentProps<typeof SheetPrimitive.Close>>) {
    return (
        <SheetPrimitive.Close
            data-slot="sheet-close"
            render={renderFromAsChild(asChild, children, render)}
            {...props}
        >
            {asChild ? undefined : children}
        </SheetPrimitive.Close>
    );
}

function SheetPortal({
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
    return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
    className,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Backdrop>) {
    return (
        <SheetPrimitive.Backdrop
            data-slot="sheet-overlay"
            className={cn(
                'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 bg-black/50',
                className,
            )}
            {...props}
        />
    );
}

function SheetContent({
    className,
    children,
    side = 'right',
    ...props
}: Omit<React.ComponentProps<typeof SheetPrimitive.Popup>, 'children'> & {
    children?: React.ReactNode;
    side?: 'top' | 'right' | 'bottom' | 'left';
    forceMount?: boolean;
}) {
    const { forceMount, ...popupProps } = props;

    return (
        <SheetPortal keepMounted={forceMount}>
            <SheetOverlay />
            <SheetPrimitive.Popup
                data-slot="sheet-content"
                className={cn(
                    'bg-white data-open:animate-in data-closed:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-closed:duration-300 data-open:duration-500 dark:bg-slate-950',
                    side === 'right' &&
                        'data-ending-style:translate-x-full data-starting-style:translate-x-full inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
                    side === 'left' &&
                        'data-ending-style:-translate-x-full data-starting-style:-translate-x-full inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
                    side === 'top' &&
                        'data-ending-style:-translate-y-full data-starting-style:-translate-y-full inset-x-0 top-0 h-auto border-b',
                    side === 'bottom' &&
                        'data-ending-style:translate-y-full data-starting-style:translate-y-full inset-x-0 bottom-0 h-auto border-t',
                    className,
                )}
                {...popupProps}
            >
                {children}
                <SheetPrimitive.Close className="ring-offset-white focus:ring-slate-950 absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none dark:ring-offset-slate-950 dark:focus:ring-slate-300">
                    <XIcon className="size-4" />
                    <span className="sr-only">Close</span>
                </SheetPrimitive.Close>
            </SheetPrimitive.Popup>
        </SheetPortal>
    );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="sheet-header"
            className={cn('flex flex-col gap-1.5 p-4', className)}
            {...props}
        />
    );
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="sheet-footer"
            className={cn('mt-auto flex flex-col gap-2 p-4', className)}
            {...props}
        />
    );
}

function SheetTitle({
    className,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
    return (
        <SheetPrimitive.Title
            data-slot="sheet-title"
            className={cn('text-slate-950 font-semibold dark:text-slate-50', className)}
            {...props}
        />
    );
}

function SheetDescription({
    className,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
    return (
        <SheetPrimitive.Description
            data-slot="sheet-description"
            className={cn('text-slate-500 text-sm dark:text-slate-400', className)}
            {...props}
        />
    );
}

export {
    Sheet,
    SheetTrigger,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
};
