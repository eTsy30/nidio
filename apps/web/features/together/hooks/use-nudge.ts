"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ApiError } from "@/shared/api/client/api";

import { togetherKeys } from "../api/query-keys";
import { tasksApi } from "../api/tasks.api";

export function useNudge() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: tasksApi.nudge,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: togetherKeys.all });
      toast.success("Напоминание отправлено");
    },
    onError: (error: ApiError) =>
      toast.error(error.response?.data?.message ?? "Не удалось отправить напоминание"),
  });
}
