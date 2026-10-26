'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cn } from '@eos/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

function Tabs({
    className,
    orientation = 'horizontal',
    activationMode: _activationMode,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & {
    activationMode?: 'automatic' | 'manual';
}) {
    return (
        <TabsPrimitive.Root
            data-slot="tabs"
            data-orientation={orientation}
            orientation={orientation}
            className={cn(
                'gap-2 group/tabs flex data-[orientation=horizontal]:flex-col',
                className,
            )}
            {...props}
        />
    );
}

const tabsListVariants = cva(
    [
        'rounded-lg p-[3px] group-data-[orientation=horizontal]/tabs:h-8 data-[variant=line]:rounded-none group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
        // A horizontal strip that outgrows its container scrolls instead of being
        // clipped. The line variant's active indicator (bottom-[-5px]) overhangs
        // the 3px padding, so reserve 3px more below it (taller strip, same
        // content height) and cancel that extra with a negative margin so the
        // surrounding layout does not shift.
        'group-data-[orientation=horizontal]/tabs:max-w-full group-data-[orientation=horizontal]/tabs:overflow-x-auto',
        'group-data-[orientation=horizontal]/tabs:data-[variant=line]:h-[calc(2rem+3px)] group-data-[orientation=horizontal]/tabs:data-[variant=line]:pb-1.5 group-data-[orientation=horizontal]/tabs:data-[variant=line]:-mb-[3px]',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    ],
    {
        variants: {
            variant: {
                default: 'bg-muted',
                line: 'gap-1 bg-transparent',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

function TabsList({
    className,
    variant = 'default',
    loop,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
    VariantProps<typeof tabsListVariants> & { loop?: boolean }) {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            data-variant={variant}
            loopFocus={props.loopFocus ?? loop}
            className={cn(tabsListVariants({ variant }), className)}
            {...props}
        />
    );
}

function TabsTrigger({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Tab>) {
    return (
        <TabsPrimitive.Tab
            data-slot="tabs-trigger"
            className={cn(
                "gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-bold group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg:not([class*='size-'])]:size-4 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center whitespace-nowrap transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
                'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent',
                'data-active:bg-background dark:data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 data-active:text-foreground',
                "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity after:content-[''] group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
                className,
            )}
            {...props}
        />
    );
}

function TabsContent({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Panel>) {
    return (
        <TabsPrimitive.Panel
            data-slot="tabs-content"
            className={cn('text-sm flex-1 outline-none', className)}
            {...props}
        />
    );
}

export { Tabs, TabsContent, TabsList, tabsListVariants, TabsTrigger };
