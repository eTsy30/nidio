import { QueryClient } from "@tanstack/react-query";

import { responseInterceptor } from "../interceptors/response.interceptor";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
    mutations: {
      retry: 1,
    },
  },
});
