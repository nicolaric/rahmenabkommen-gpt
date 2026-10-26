import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
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
    return render as never;
}

function Collapsible({
    asChild,
    render,
    children,
    ...props
}: WithAsChild<React.ComponentProps<typeof CollapsiblePrimitive.Root>>) {
    return (
        <CollapsiblePrimitive.Root
            render={renderFromAsChild(asChild, children, render)}
            {...props}
        >
            {asChild ? undefined : children}
        </CollapsiblePrimitive.Root>
    );
}

function CollapsibleTrigger({
    asChild,
    render,
    children,
    ...props
}: WithAsChild<React.ComponentProps<typeof CollapsiblePrimitive.Trigger>>) {
    return (
        <CollapsiblePrimitive.Trigger
            render={renderFromAsChild(asChild, children, render)}
            {...props}
        >
            {asChild ? undefined : children}
        </CollapsiblePrimitive.Trigger>
    );
}

function CollapsibleContent({
    forceMount,
    keepMounted = forceMount,
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Panel> & {
    forceMount?: boolean;
}) {
    return <CollapsiblePrimitive.Panel keepMounted={keepMounted} {...props} />;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
