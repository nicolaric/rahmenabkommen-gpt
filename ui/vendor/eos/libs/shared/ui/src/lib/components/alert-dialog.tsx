import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { cn } from '@eos/utils';
import * as React from 'react';
import { Button } from './button';

type WithAsChild<T> = T & { asChild?: boolean };

function renderFromAsChild(
    asChild: boolean | undefined,
    children: React.ReactNode,
    render: unknown,
) {
    if (asChild && React.isValidElement(children)) {
        return children;
    }
    return render as React.ComponentProps<typeof AlertDialogPrimitive.Trigger>['render'];
}

function AlertDialog({
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
    return <AlertDialogPrimitive.Root {...props} />;
}

function AlertDialogTrigger({
    asChild,
    render,
    children,
    ...props
}: WithAsChild<React.ComponentProps<typeof AlertDialogPrimitive.Trigger>>) {
    return (
        <AlertDialogPrimitive.Trigger
            data-slot="alert-dialog-trigger"
            render={renderFromAsChild(asChild, children, render)}
            {...props}
        >
            {asChild ? undefined : children}
        </AlertDialogPrimitive.Trigger>
    );
}

function AlertDialogPortal({
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
    return (
        <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
    );
}

function AlertDialogOverlay({
    className,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Backdrop>) {
    return (
        // Needed when alert dialogs are nested inside another modal, such as
        // the mobile sidebar sheet; Base UI otherwise suppresses the backdrop.
        <AlertDialogPrimitive.Backdrop
            data-slot="alert-dialog-overlay"
            forceRender
            className={cn(
                'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/50 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-50',
                className,
            )}
            {...props}
        />
    );
}

function AlertDialogContent({
    className,
    size = 'default',
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Popup> & {
    size?: 'default' | 'sm' | 'lg';
}) {
    return (
        <AlertDialogPortal>
            <AlertDialogOverlay />
            <AlertDialogPrimitive.Popup
                data-slot="alert-dialog-content"
                data-size={size}
                className={cn(
                    'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 bg-background ring-foreground/10 gap-4 rounded-xl p-4 ring-1 duration-100 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=lg]:max-w-xs data-[size=default]:sm:max-w-sm data-[size=lg]:sm:max-w-lg group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 outline-none',
                    className,
                )}
                {...props}
            />
        </AlertDialogPortal>
    );
}

function AlertDialogHeader({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="alert-dialog-header"
            className={cn(
                'grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-4 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr] sm:group-data-[size=lg]/alert-dialog-content:place-items-start sm:group-data-[size=lg]/alert-dialog-content:text-left sm:group-data-[size=lg]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]',
                className,
            )}
            {...props}
        />
    );
}

function AlertDialogFooter({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="alert-dialog-footer"
            className={cn(
                'bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end',
                className,
            )}
            {...props}
        />
    );
}

function AlertDialogMedia({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="alert-dialog-media"
            className={cn(
                "bg-muted mb-2 inline-flex size-10 items-center justify-center rounded-md sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-6",
                className,
            )}
            {...props}
        />
    );
}

function AlertDialogTitle({
    className,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
    return (
        <AlertDialogPrimitive.Title
            data-slot="alert-dialog-title"
            className={cn(
                'text-base font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2',
                className,
            )}
            {...props}
        />
    );
}

function AlertDialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
    return (
        <AlertDialogPrimitive.Description
            data-slot="alert-dialog-description"
            className={cn(
                'text-muted-foreground *:[a]:hover:text-foreground text-sm text-balance md:text-pretty *:[a]:underline *:[a]:underline-offset-3',
                className,
            )}
            {...props}
        />
    );
}

function AlertDialogAction({
    className,
    variant = 'default',
    size = 'default',
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Close> &
    Pick<React.ComponentProps<typeof Button>, 'variant' | 'size'>) {
    return (
        <AlertDialogPrimitive.Close
            data-slot="alert-dialog-action"
            render={<Button variant={variant} size={size} />}
            className={cn(className)}
            {...props}
        />
    );
}

function AlertDialogCancel({
    className,
    variant = 'outline',
    size = 'default',
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Close> &
    Pick<React.ComponentProps<typeof Button>, 'variant' | 'size'>) {
    return (
        <AlertDialogPrimitive.Close
            data-slot="alert-dialog-cancel"
            render={<Button variant={variant} size={size} />}
            className={cn(className)}
            {...props}
        />
    );
}

export {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogOverlay,
    AlertDialogPortal,
    AlertDialogTitle,
    AlertDialogTrigger,
};
