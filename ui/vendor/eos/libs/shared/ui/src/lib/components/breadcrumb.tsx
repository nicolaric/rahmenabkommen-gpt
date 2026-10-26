import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cn } from '@eos/utils';
import { ChevronRightIcon, EllipsisIcon } from 'lucide-react';
import * as React from 'react';

const Breadcrumb = React.forwardRef<
    HTMLElement,
    React.ComponentPropsWithoutRef<'nav'> & {
        separator?: React.ReactNode;
    }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />);
Breadcrumb.displayName = 'Breadcrumb';

const BreadcrumbList = React.forwardRef<
    HTMLOListElement,
    React.ComponentPropsWithoutRef<'ol'>
>(({ className, ...props }, ref) => (
    <ol
        ref={ref}
        className={cn(
            'flex flex-wrap items-center gap-1.5 break-words text-sm text-slate-500 sm:gap-2.5 dark:text-slate-400',
            className,
        )}
        {...props}
    />
));
BreadcrumbList.displayName = 'BreadcrumbList';

const BreadcrumbItem = React.forwardRef<
    HTMLLIElement,
    React.ComponentPropsWithoutRef<'li'>
>(({ className, ...props }, ref) => (
    <li
        ref={ref}
        className={cn('inline-flex items-center gap-1.5', className)}
        {...props}
    />
));
BreadcrumbItem.displayName = 'BreadcrumbItem';

const BreadcrumbLink = React.forwardRef<
    HTMLAnchorElement,
    useRender.ComponentProps<'a'> & { asChild?: boolean }
>(({ asChild, render, children, className, ...props }, ref) => {
    const child = asChild ? React.Children.only(children) : undefined;

    return useRender({
        defaultTagName: 'a',
        render: asChild && React.isValidElement(child) ? child : render,
        ref,
        props: mergeProps<'a'>(
            {
                className: cn(
                    'transition-colors hover:text-slate-950 dark:hover:text-slate-50',
                    className,
                ),
                children: asChild ? undefined : children,
            } as React.ComponentProps<'a'>,
            props,
        ),
    });
});
BreadcrumbLink.displayName = 'BreadcrumbLink';

const BreadcrumbPage = React.forwardRef<
    HTMLSpanElement,
    React.ComponentPropsWithoutRef<'span'>
>(({ className, ...props }, ref) => (
    <span
        ref={ref}
        role="link"
        aria-disabled="true"
        aria-current="page"
        className={cn('font-normal text-slate-950 dark:text-slate-50', className)}
        {...props}
    />
));
BreadcrumbPage.displayName = 'BreadcrumbPage';

const BreadcrumbSeparator = ({
    children,
    className,
    ...props
}: React.ComponentProps<'li'>) => (
    <li
        role="presentation"
        aria-hidden="true"
        className={cn('[&>svg]:w-3.5 [&>svg]:h-3.5', className)}
        {...props}
    >
        {children ?? <ChevronRightIcon />}
    </li>
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

const BreadcrumbEllipsis = ({
    className,
    ...props
}: React.ComponentProps<'span'>) => (
    <span
        role="presentation"
        aria-hidden="true"
        className={cn('flex h-9 w-9 items-center justify-center', className)}
        {...props}
    >
        <EllipsisIcon className="h-4 w-4" />
        <span className="sr-only">More</span>
    </span>
);
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

export {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
};
