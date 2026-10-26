import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

const defaultQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s before a query is considered stale
      retry: 1, // retry once on failure
      refetchOnWindowFocus: false,
    },
  },
};

/**
 * Provides the TanStack Query client to the component tree.
 * Creates a single QueryClient instance on mount (client-side).
 * During SSR this renders children without interference since
 * no useQuery calls happen during server render.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient(defaultQueryClientOptions),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
