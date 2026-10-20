"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { http } from "@/shared/api/client/api";
import { useAuth } from "@/shared/api/provider/auth-provider";
import type { SavingsGoal } from "@/shared/contracts/savings";
import { apolloClient } from "@/shared/lib/apollo-client";
import { getAccessToken } from "@/shared/lib/token";

import { listOutbox, subscribeOutbox } from "./outbox";
import { syncOutbox } from "./outbox-sync";
import { isLogoutPending, saveOfflineSnapshot } from "./snapshot";

export function OutboxSync() {
  const { user, isAuthenticated } = useAuth();
  const client = useQueryClient();
  useEffect(() => {
    if (!user || !isAuthenticated) return;
    const userId = user.id;
    let disposed = false;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      const token = getAccessToken();
      if (!navigator.onLine || !token || isLogoutPending()) return;
      const isCurrent = () =>
        !disposed &&
        navigator.onLine &&
        !isLogoutPending() &&
        getAccessToken() === token &&
        client.getQueryData<{ id: string }>(["auth", "user"])?.id === userId;
      try {
        if (!listOutbox(userId).some((operation) => operation.status === "pending")) return;
      } catch {
        return;
      }
      void syncOutbox({
        userId,
        isCurrent,
        getCoupleId: async () =>
          (await http.get<{ id: string } | null>("/relationship/couple"))?.id ?? null,
        send: async (operation) => {
          return http.post<SavingsGoal>(
            `/savings/${encodeURIComponent(operation.goalId)}/installments/${encodeURIComponent(operation.installmentId)}/save`,
          );
        },
        onConfirmed: async (operation, goal) => {
          if (!isCurrent()) return;
          if (goal.id !== operation.goalId || !Array.isArray(goal.installments))
            throw new Error("Некорректный ответ сервера");
          client.setQueryData<SavingsGoal[]>(["savings", operation.coupleId], (goals = []) =>
            goals.some((item) => item.id === goal.id)
              ? goals.map((item) => (item.id === goal.id ? goal : item))
              : [...goals, goal],
          );
          if (!saveOfflineSnapshot(client, apolloClient.cache, userId)) {
            throw new Error("Не удалось обновить данные на устройстве");
          }
        },
      }).catch(() => undefined);
    };
    const schedule = () => {
      clearTimeout(debounce);
      debounce = setTimeout(run, 100);
    };
    const unsubscribe = subscribeOutbox(schedule);
    window.addEventListener("online", schedule);
    window.addEventListener("focus", schedule);
    const timer = setInterval(run, 30_000);
    schedule();
    return () => {
      disposed = true;
      clearTimeout(debounce);
      clearInterval(timer);
      unsubscribe();
      window.removeEventListener("online", schedule);
      window.removeEventListener("focus", schedule);
    };
  }, [client, user, isAuthenticated]);
  return null;
}
