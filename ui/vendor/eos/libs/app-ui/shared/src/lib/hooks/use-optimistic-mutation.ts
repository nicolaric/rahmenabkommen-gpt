import {
  useMutation,
  useQueryClient,
  type MutationKey,
  type QueryKey,
} from '@tanstack/react-query';

export interface UseOptimisticMutationOptions<TVariables, TData> {
  /** The mutation function that performs the API call */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** The query key whose cache will be optimistically updated */
  queryKey: QueryKey;
  /**
   * A function that receives the current cached data and the mutation
   * variables, and returns the optimistically updated data.
   * Return the old data unchanged if no update is needed.
   */
  optimisticUpdater: (oldData: unknown, variables: TVariables) => unknown;
  /** Called after the mutation succeeds and after cache invalidation */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Called if the mutation fails — the cache is already rolled back */
  onError?: (error: Error, variables: TVariables) => void;
  mutationKey?: MutationKey;
}

/**
 * A reusable hook for optimistic mutations with automatic rollback.
 *
 * 1. Immediately applies an optimistic update to the query cache
 * 2. Fires the mutation to the server
 * 3. On success: invalidates the query to refetch fresh data
 * 4. On error: rolls back the cache to the previous state
 *
 * @example
 * ```tsx
 * const deleteDoc = useOptimisticMutation({
 *   mutationFn: (id: string) => deleteDocument(id, orgId),
 *   queryKey: ['documents', orgId],
 *   optimisticUpdater: (old, id) => ({
 *     ...old,
 *     data: old.data.filter((d) => d.id !== id),
 *   }),
 *   onError: () => toast.error('Failed to delete'),
 * });
 * ```
 */
export function useOptimisticMutation<TVariables, TData>(
  options: UseOptimisticMutationOptions<TVariables, TData>,
) {
  const queryClient = useQueryClient();
  const { queryKey, optimisticUpdater, onError, onSuccess, mutationFn } =
    options;

  return useMutation({
    mutationFn,
    mutationKey: options.mutationKey,
    onMutate: async (variables: TVariables) => {
      // Cancel any in-flight queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Apply the optimistic update
      queryClient.setQueryData(queryKey, (old: unknown) =>
        optimisticUpdater(old, variables),
      );

      return { previousData };
    },
    onError: (err: Error, variables: TVariables, context) => {
      // Roll back on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      onError?.(err, variables);
    },
    onSettled: () => {
      // Always refetch after mutation to ensure consistency with server
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: onSuccess
      ? (data: TData, variables: TVariables) => {
          onSuccess(data, variables);
        }
      : undefined,
  });
}
