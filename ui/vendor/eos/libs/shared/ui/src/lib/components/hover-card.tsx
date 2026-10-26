import { PreviewCard as HoverCardPrimitive } from '@base-ui/react/preview-card';
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
    return render as React.ComponentProps<typeof HoverCardPrimitive.Trigger>['render'];
}

function HoverCard({
    openDelay,
    closeDelay,
    ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root> & {
    openDelay?: number;
    closeDelay?: number;
}) {
    return (
        <HoverCardPrimitive.Root
            data-open-delay={openDelay}
            data-close-delay={closeDelay}
            {...props}
        />
    );
}

function HoverCardTrigger({
    asChild,
    render,
    children,
    ...props
}: WithAsChild<React.ComponentProps<typeof HoverCardPrimitive.Trigger>>) {
    return (
        <HoverCardPrimitive.Trigger
            data-slot="hover-card-trigger"
            render={renderFromAsChild(asChild, children, render)}
            {...props}
        >
            {asChild ? undefined : children}
        </HoverCardPrimitive.Trigger>
    );
}

type HoverCardContentProps = React.ComponentProps<typeof HoverCardPrimitive.Popup> &
    Pick<
        React.ComponentProps<typeof HoverCardPrimitive.Positioner>,
        'align' | 'alignOffset' | 'side' | 'sideOffset'
    >;

function HoverCardContent({
    className,
    align = 'center',
    alignOffset,
    side,
    sideOffset = 4,
    ...props
}: HoverCardContentProps) {
    return (
        <HoverCardPrimitive.Portal data-slot="hover-card-portal">
            <HoverCardPrimitive.Positioner
                align={align}
                alignOffset={alignOffset}
                side={side}
                sideOffset={sideOffset}
                className="isolate z-50"
            >
                <HoverCardPrimitive.Popup
                    data-slot="hover-card-content"
                    className={cn(
                        'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground w-64 rounded-lg p-2.5 text-sm shadow-md ring-1 duration-100 z-50 origin-(--transform-origin) outline-hidden',
                        className,
                    )}
                    {...props}
                />
            </HoverCardPrimitive.Positioner>
        </HoverCardPrimitive.Portal>
    );
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
