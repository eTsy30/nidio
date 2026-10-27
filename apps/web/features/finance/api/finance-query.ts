import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { http } from "@/shared/api/client/api";
import { useAuth } from "@/shared/api/provider/auth-provider";

import type { FinancePageResult } from "../model/types";

import { useFinance, useFinancePolling } from "./FinanceProvider";

export function isFinanceAccessError(error: unknown) {
  return isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0);
}
export function useFinanceResource<T>(
  path: string,
  params: Record<string, string>,
  enabled = true,
) {
  const { data } = useFinance();
  const { user } = useAuth();
  const refetchInterval = useFinancePolling();
  return useQuery({
    queryKey: ["finance", data.coupleId, user?.id, path, params],
    queryFn: ({ signal }) => http.get<T>(`/finance${path}`, { params, signal }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval,
    enabled,
  });
}
export function useFinancePages<T, P extends FinancePageResult<T> = FinancePageResult<T>>(
  path: string,
  params: Record<string, string>,
  enabled = true,
) {
  const { data } = useFinance();
  const { user } = useAuth();
  const refetchInterval = useFinancePolling();
  return useInfiniteQuery({
    queryKey: ["finance", data.coupleId, user?.id, path, params],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      http.get<P>(`/finance${path}`, {
        params: { ...params, ...(pageParam ? { cursor: pageParam } : {}) },
        signal,
      }),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval,
    enabled,
  });
}
