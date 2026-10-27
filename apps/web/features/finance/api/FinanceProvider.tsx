"use client";
import { createContext, type ReactNode, useContext, useEffect, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { http } from "@/shared/api/client/api";
import { useAuth } from "@/shared/api/provider/auth-provider";
import { useRealtimeContext } from "@/shared/realtime/provider/RealtimeProvider";

import type { FinanceData } from "../model/types";
export type Write = (
  path: string,
  method: "post" | "patch" | "put" | "delete",
  body?: unknown,
  options?: { silent?: boolean },
) => Promise<unknown>;
const Context = createContext<{
  data: FinanceData;
  busy: boolean;
  write: Write;
  name: (id: string) => string;
} | null>(null);
export function useFinance() {
  const value = useContext(Context);
  if (!value) throw new Error("FinanceProvider missing");
  return value;
}
export function useFinancePolling() {
  const { socket } = useRealtimeContext();
  const connected = useSyncExternalStore(
    (notify) => {
      socket?.on("connect", notify);
      socket?.on("disconnect", notify);
      return () => {
        socket?.off("connect", notify);
        socket?.off("disconnect", notify);
      };
    },
    () => Boolean(socket?.connected),
    () => false,
  );
  return connected ? false : 30000;
}
export function useFinanceData(coupleId: string, section: string, goalId?: string) {
  const { user } = useAuth();
  const refetchInterval = useFinancePolling();
  const client = useQueryClient();
  const { socket } = useRealtimeContext();
  useEffect(() => {
    const refresh = () => {
      if (!client.isMutating({ mutationKey: ["finance-write", coupleId] }))
        void client.invalidateQueries({ queryKey: ["finance", coupleId] });
    };
    socket?.on("finance.updated", refresh);
    socket?.on("connect", refresh);
    return () => {
      socket?.off("finance.updated", refresh);
      socket?.off("connect", refresh);
    };
  }, [socket, client, coupleId]);
  return useQuery({
    queryKey: ["finance", coupleId, user?.id, section, goalId ?? "list"],
    queryFn: ({ signal }) =>
      http.get<FinanceData>(
        goalId ? `/finance/goal/${encodeURIComponent(goalId)}` : `/finance/sections/${section}`,
        { signal },
      ),
    enabled: Boolean(coupleId && user),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval,
  });
}
export function FinanceProvider({ data, children }: { data: FinanceData; children: ReactNode }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const mutationKey = ["finance-write", data.coupleId];
  const mutation = useMutation({
    mutationKey,
    mutationFn: ({
      path,
      method,
      body,
    }: {
      path: string;
      method: "post" | "patch" | "put" | "delete";
      body?: unknown;
    }) =>
      method === "delete" ? http.delete(`/finance${path}`) : http[method](`/finance${path}`, body),
    onSettled: async () => {
      if (client.isMutating({ mutationKey }) !== 1) return;
      await client.invalidateQueries({ queryKey: ["finance", data.coupleId] });
    },
  });
  const write: Write = async (path, method, body, options) => {
    const result = await mutation.mutateAsync({ path, method, body });
    const awarded =
      result && typeof result === "object" && "awarded" in result ? result.awarded : null;
    if (Array.isArray(awarded) && awarded.includes(100)) {
      toast.success("Цель достигнута! Вы накопили нужную сумму.");
    } else if (!options?.silent && !path.endsWith("/used")) toast.success("Сохранено");
    return result;
  };
  const name = (id: string) =>
    id === user?.id ? "Я" : (data.members.find((m) => m.id === id)?.firstName ?? "Участник пары");
  return (
    <Context.Provider value={{ data, busy: mutation.isPending, write, name }}>
      {children}
    </Context.Provider>
  );
}
