import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';
import { cn } from '@eos/utils';
import * as React from 'react';

function Avatar({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
    return (
        <AvatarPrimitive.Root
            className={cn(
                'relative flex shrink-0 overflow-hidden rounded-full',
                className,
            )}
            {...props}
        />
    );
}

function AvatarImage({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
    return (
        <AvatarPrimitive.Image
            className={cn('aspect-square h-full w-full', className)}
            {...props}
        />
    );
}

function AvatarFallback({
    className,
    delayMs,
    delay,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback> & { delayMs?: number }) {
    return (
        <AvatarPrimitive.Fallback
            delay={delay ?? delayMs}
            className={cn(
                'flex h-full w-full items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800',
                className,
            )}
            {...props}
        />
    );
}

export { Avatar, AvatarImage, AvatarFallback };
