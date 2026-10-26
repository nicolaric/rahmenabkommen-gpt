import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
        undefined,
    );

    React.useEffect(() => {
        // Guard against SSR
        if (typeof window === 'undefined') return;

        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

        const onChange = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };

        // Set initial value
        onChange();

        // Listen for changes
        mql.addEventListener('change', onChange);

        return () => {
            mql.removeEventListener('change', onChange);
        };
    }, []);

    // During SSR or before first effect, return false (or handle as needed)
    // You might want to keep it undefined until hydration if you need to distinguish
    return isMobile ?? false;
}
