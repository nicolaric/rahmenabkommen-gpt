import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@eos/utils';

const markerVariants = cva(
    'flex w-fit items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: '',
                border: 'w-full border-b py-2',
                separator:
                    'w-full justify-center text-xs before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

function Marker({
    className,
    variant,
    ...props
}: React.ComponentProps<'div'> & VariantProps<typeof markerVariants>) {
    return (
        <div
            data-slot="marker"
            className={cn(markerVariants({ variant }), className)}
            {...props}
        />
    );
}

function MarkerIcon({ className, ...props }: React.ComponentProps<'span'>) {
    return (
        <span
            data-slot="marker-icon"
            aria-hidden="true"
            className={cn('inline-flex items-center justify-center', className)}
            {...props}
        />
    );
}

function MarkerContent({ className, ...props }: React.ComponentProps<'span'>) {
    return (
        <span
            data-slot="marker-content"
            className={cn('min-w-0 truncate', className)}
            {...props}
        />
    );
}

export { Marker, MarkerContent, MarkerIcon, markerVariants };
