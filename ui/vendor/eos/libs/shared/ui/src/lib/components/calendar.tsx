import { cn } from '@eos/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';

import { buttonVariants } from './button';

/**
 * react-day-picker with the design system's button and surface styles applied
 * to its slots, so a calendar in a popover matches the rest of the chrome.
 */
function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: DayPickerProps) {
    return (
        <DayPicker
            data-slot="calendar"
            showOutsideDays={showOutsideDays}
            className={cn('relative w-fit p-3', className)}
            classNames={{
                months: 'flex flex-col gap-4 sm:flex-row',
                month: 'flex w-fit flex-col gap-4',
                month_caption: 'flex h-7 items-center justify-center',
                caption_label: 'text-sm font-medium',
                nav: 'flex items-center gap-1',
                button_previous: cn(
                    buttonVariants({ variant: 'outline', size: 'icon-sm' }),
                    'absolute left-3 top-3 z-10 opacity-70 hover:opacity-100 disabled:opacity-30',
                ),
                button_next: cn(
                    buttonVariants({ variant: 'outline', size: 'icon-sm' }),
                    'absolute right-3 top-3 z-10 opacity-70 hover:opacity-100 disabled:opacity-30',
                ),
                month_grid: 'w-56 table-fixed border-collapse',
                weekdays: 'flex w-full',
                weekday:
                    'w-8 rounded-md text-[0.8rem] font-normal text-muted-foreground',
                week: 'mt-1 flex w-full',
                day: 'relative size-8 p-0 text-center text-sm',
                day_button: cn(
                    buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                    'size-8 p-0 font-normal aria-selected:opacity-100',
                ),
                selected:
                    '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
                today: '[&>button]:bg-muted [&>button]:font-medium',
                outside: 'text-muted-foreground/60',
                disabled: 'text-muted-foreground opacity-50',
                hidden: 'invisible',
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, ...chevronProps }) =>
                    orientation === 'left' ? (
                        <ChevronLeft className="size-4" {...chevronProps} />
                    ) : (
                        <ChevronRight className="size-4" {...chevronProps} />
                    ),
            }}
            {...props}
        />
    );
}

export { Calendar };
