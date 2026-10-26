import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import { cn } from '@eos/utils';
import * as React from 'react';

function ScrollArea({
    className,
    children,
    type: _type,
    scrollHideDelay: _scrollHideDelay,
    ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
    type?: 'auto' | 'always' | 'scroll' | 'hover';
    scrollHideDelay?: number;
}) {
    return (
        <ScrollAreaPrimitive.Root
            data-slot="scroll-area"
            className={cn('relative h-full w-full', className)}
            {...props}
        >
            <ScrollAreaPrimitive.Viewport
                data-slot="scroll-area-viewport"
                className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
            >
                <ScrollAreaPrimitive.Content>{children}</ScrollAreaPrimitive.Content>
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    );
}

function ScrollBar({
    className,
    orientation = 'vertical',
    ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>) {
    return (
        <ScrollAreaPrimitive.Scrollbar
            data-slot="scroll-area-scrollbar"
            data-orientation={orientation}
            orientation={orientation}
            className={cn(
                'data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent flex touch-none p-px transition-colors select-none',
                className,
            )}
            {...props}
        >
            <ScrollAreaPrimitive.Thumb
                data-slot="scroll-area-thumb"
                className="rounded-full bg-border relative flex-1"
            />
        </ScrollAreaPrimitive.Scrollbar>
    );
}

export { ScrollArea, ScrollBar };
