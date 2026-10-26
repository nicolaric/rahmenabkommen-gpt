import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { cn } from '@eos/utils';
import * as React from 'react';

function Progress({
    className,
    value,
    ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
    return (
        <ProgressPrimitive.Root
            data-slot="progress"
            value={value}
            className={cn(
                'bg-muted h-1 rounded-full relative flex w-full items-center overflow-x-hidden',
                className,
            )}
            {...props}
        >
            <ProgressPrimitive.Track className="size-full flex-1">
                <ProgressPrimitive.Indicator
                    data-slot="progress-indicator"
                    className="bg-primary size-full transition-all"
                />
            </ProgressPrimitive.Track>
        </ProgressPrimitive.Root>
    );
}

export { Progress };
