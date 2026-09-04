"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tasksApi } from "../api/tasks.api";

export function useNudge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.nudge(taskId),
    onMutate: async (taskId) => {
      // Защита от спама: можно добавить локальную блокировку через timestamp в кеше
      const key = ["nudge-cooldown", taskId];
      const last = queryClient.getQueryData<number>(key);
      const now = Date.now();
      if (last && now - last < 5 * 60 * 1000) {
        throw new Error("Cooldown");
      }
      queryClient.setQueryData(key, now);
    },
    onSuccess: () => {
      // Realtime event должен прийти от бэкенда и обновить UI
    },
  });
}
