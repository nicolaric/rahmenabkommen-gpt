import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { cn } from '@eos/utils';
import { CheckIcon } from 'lucide-react';
import * as React from 'react';

type CheckboxProps = Omit<
    React.ComponentProps<typeof CheckboxPrimitive.Root>,
    'checked' | 'defaultChecked'
> & {
    checked?: boolean | 'indeterminate';
    defaultChecked?: boolean | 'indeterminate';
};

function Checkbox({
    className,
    checked,
    defaultChecked,
    indeterminate,
    ...props
}: CheckboxProps) {
    const isIndeterminate = indeterminate || checked === 'indeterminate';

    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            checked={checked === 'indeterminate' ? false : checked}
            defaultChecked={
                defaultChecked === 'indeterminate' ? false : defaultChecked
            }
            indeterminate={isIndeterminate}
            className={cn(
                'peer inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-slate-200 border-slate-900 shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-checked:bg-slate-900 data-checked:text-slate-50 data-indeterminate:bg-slate-900 data-indeterminate:text-slate-50 dark:border-slate-800 dark:border-slate-50 dark:focus-visible:ring-slate-300 dark:data-checked:bg-slate-50 dark:data-checked:text-slate-900 dark:data-indeterminate:bg-slate-50 dark:data-indeterminate:text-slate-900',
                className,
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator
                className={cn('flex h-4 w-4 items-center justify-center text-current')}
            >
                <CheckIcon className="h-4 w-4" />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };
