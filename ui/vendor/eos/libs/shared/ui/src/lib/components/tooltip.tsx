import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
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
    return render as React.ComponentProps<typeof TooltipPrimitive.Trigger>['render'];
}

function TooltipProvider({
    delayDuration,
    skipDelayDuration,
    delay = delayDuration ?? 0,
    timeout = skipDelayDuration,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider> & {
    delayDuration?: number;
    skipDelayDuration?: number;
}) {
    return (
        <TooltipPrimitive.Provider
            data-slot="tooltip-provider"
            delay={delay}
            timeout={timeout}
            {...props}
        />
    );
}

function Tooltip({
    delayDuration,
    disableHoverableContent,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root> & {
    delayDuration?: number;
    disableHoverableContent?: boolean;
}) {
    return (
        <TooltipProvider>
            <TooltipPrimitive.Root
                data-slot="tooltip"
                disableHoverablePopup={disableHoverableContent}
                {...(delayDuration === undefined ? {} : { delay: delayDuration })}
                {...props}
            />
        </TooltipProvider>
    );
}

function TooltipTrigger({
    asChild,
    render,
    children,
    ...props
}: WithAsChild<React.ComponentProps<typeof TooltipPrimitive.Trigger>>) {
    return (
        <TooltipPrimitive.Trigger
            data-slot="tooltip-trigger"
            render={renderFromAsChild(asChild, children, render)}
            {...props}
        >
            {asChild ? undefined : children}
        </TooltipPrimitive.Trigger>
    );
}

type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Popup> &
    Pick<
        React.ComponentProps<typeof TooltipPrimitive.Positioner>,
        'align' | 'alignOffset' | 'side' | 'sideOffset'
    >;

function TooltipContent({
    className,
    sideOffset = 4,
    align,
    alignOffset,
    side,
    children,
    ...props
}: TooltipContentProps) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Positioner
                align={align}
                alignOffset={alignOffset}
                side={side}
                sideOffset={sideOffset}
                className="isolate z-50"
            >
                <TooltipPrimitive.Popup
                    data-slot="tooltip-content"
                    className={cn(
                        'bg-slate-950 text-white animate-in fade-in-0 zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--transform-origin) rounded-md px-3 py-1.5 text-xs text-balance dark:bg-slate-50 dark:text-slate-950',
                        className,
                    )}
                    {...props}
                >
                    {children}
                    <TooltipPrimitive.Arrow className="bg-slate-950 fill-foreground z-50 size-2.5 rotate-45 rounded-[2px] data-[side=top]:translate-y-0 data-[side=bottom]:translate-y-[calc(-50%_-_2px)] data-[side=left]:translate-x-[calc(50%_+_2px)] data-[side=right]:translate-x-[calc(-50%_-_2px)] dark:bg-slate-50" />
                </TooltipPrimitive.Popup>
            </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
    );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
