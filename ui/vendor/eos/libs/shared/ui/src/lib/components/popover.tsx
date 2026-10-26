import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { cn } from '@eos/utils';
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
    return render as React.ComponentProps<typeof PopoverPrimitive.Trigger>['render'];
}

function Popover({
    ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
    return <PopoverPrimitive.Root {...props} />;
}

function PopoverTrigger({
    asChild,
    render,
    children,
    ...props
}: WithAsChild<React.ComponentProps<typeof PopoverPrimitive.Trigger>>) {
    return (
        <PopoverPrimitive.Trigger
            data-slot="popover-trigger"
            render={renderFromAsChild(asChild, children, render)}
            {...props}
        >
            {asChild ? undefined : children}
        </PopoverPrimitive.Trigger>
    );
}

type PopoverContentProps = React.ComponentProps<typeof PopoverPrimitive.Popup> &
    Pick<
        React.ComponentProps<typeof PopoverPrimitive.Positioner>,
        'align' | 'alignOffset' | 'side' | 'sideOffset'
    > & {
        onOpenAutoFocus?: unknown;
    };

function PopoverContent({
    className,
    align = 'center',
    alignOffset,
    side,
    sideOffset = 4,
    onOpenAutoFocus: _onOpenAutoFocus,
    ...props
}: PopoverContentProps) {
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Positioner
                align={align}
                alignOffset={alignOffset}
                side={side}
                sideOffset={sideOffset}
                className="isolate z-50"
            >
                <PopoverPrimitive.Popup
                    data-slot="popover-content"
                    className={cn(
                        'bg-white text-slate-950 data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--transform-origin) rounded-md border border-slate-200 p-4 shadow-md outline-hidden dark:bg-slate-950 dark:text-slate-50 dark:border-slate-800',
                        className,
                    )}
                    {...props}
                />
            </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
    );
}

function PopoverAnchor({
    asChild,
    children,
    ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            'data-slot': 'popover-anchor',
            ...props,
        } as React.ComponentProps<'div'>);
    }

    return (
        <div data-slot="popover-anchor" {...props}>
            {children}
        </div>
    );
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
