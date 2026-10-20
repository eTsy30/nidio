"use client";
import { createContext, type ReactNode, useContext, useEffect } from "react";
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
export function useFinanceData(coupleId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["finance", coupleId, user?.id],
    queryFn: () => http.get<FinanceData>("/finance"),
    enabled: Boolean(coupleId && user),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });
}
export function FinanceProvider({ data, children }: { data: FinanceData; children: ReactNode }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const { socket } = useRealtimeContext();
  useEffect(() => {
    const refresh = () => {
      void client.invalidateQueries({ queryKey: ["finance", data.coupleId] });
    };
    socket?.on("finance.updated", refresh);
    socket?.on("connect", refresh);
    return () => {
      socket?.off("finance.updated", refresh);
      socket?.off("connect", refresh);
    };
  }, [socket, client, data.coupleId]);
  const mutation = useMutation({
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
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["finance", data.coupleId] });
    },
  });
  const write: Write = async (path, method, body) => {
    const result = await mutation.mutateAsync({ path, method, body });
    if (!path.endsWith("/used")) toast.success("Сохранено");
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
