import { memo, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AxiosError } from 'axios';

const onError = (error: AxiosError<{ message?: string }>) => {
  const errorMessage = error.response?.data?.message || error.message || 'error';
  alert(`error: ${errorMessage}`);
  console.error(error);

  return errorMessage;
};

const newLocal = new QueryCache({ onError });
const newLocal_1 = new MutationCache({ onError });
export const queryClient = new QueryClient({
  queryCache: newLocal,
  mutationCache: newLocal_1,
  defaultOptions: {
    queries: {
      retry: 4,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchInterval: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: 4,
    },
  },
});

function ReactQueryProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
export default memo(ReactQueryProvider);
