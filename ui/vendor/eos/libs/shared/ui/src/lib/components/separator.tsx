import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';
import { cn } from '@eos/utils';
import * as React from 'react';

function Separator({
    className,
    orientation = 'horizontal',
    decorative: _decorative,
    ...props
}: React.ComponentProps<typeof SeparatorPrimitive> & { decorative?: boolean }) {
    return (
        <SeparatorPrimitive
            data-slot="separator"
            orientation={orientation}
            className={cn(
                'bg-slate-200 shrink-0 dark:bg-slate-800',
                // Plain utilities rather than data-[orientation=…] variants, so a
                // caller passing `h-4` actually wins the tailwind-merge conflict.
                orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
                className,
            )}
            {...props}
        />
    );
}

export { Separator };
