"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Board } from "../api/board.api";
import { togetherKeys } from "../api/query-keys";
import { tasksApi } from "../api/tasks.api";
import { isTaskFuture } from "../lib/task-utils";
import { TogetherTask } from "../model/task.types";
export function useTaskCompletion() {
  const queryClient = useQueryClient();
  const [celebratedTaskId, setCelebratedTaskId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const completeMutation = useMutation({
    mutationFn: tasksApi.complete,

    onMutate: async (taskId) => {
      // Отменяем рефетч чтобы не затереть optimistic
      await queryClient.cancelQueries({ queryKey: togetherKeys.board() });
      await queryClient.cancelQueries({ queryKey: togetherKeys.today() });

      const previousBoard = queryClient.getQueryData<Board>(togetherKeys.board());
      const previousToday = queryClient.getQueryData<TogetherTask[]>(togetherKeys.today());

      // Optimistic update Board
      queryClient.setQueryData<Board>(togetherKeys.board(), (old) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t)),
          })),
        };
      });

      // Optimistic update Today
      queryClient.setQueryData<TogetherTask[]>(togetherKeys.today(), (old) => {
        if (!old) return old;
        return old.map((t) => (t.id === taskId ? { ...t, completed: true } : t));
      });

      return { previousBoard, previousToday };
    },

    onError: (_err, _taskId, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(togetherKeys.board(), context.previousBoard);
      }
      if (context?.previousToday) {
        queryClient.setQueryData(togetherKeys.today(), context.previousToday);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: togetherKeys.board() });
      queryClient.invalidateQueries({ queryKey: togetherKeys.today() });
      queryClient.invalidateQueries({ queryKey: togetherKeys.summary() });
    },

    onSuccess: (task) => {
      if (task.completed) {
        setCelebratedTaskId(task.id);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCelebratedTaskId(null), 1500);
      }
    },
  });

  const handleComplete = useCallback(
    (id: string) => {
      const task =
        queryClient
          .getQueryData<Board>(togetherKeys.board())
          ?.columns.flatMap((c) => c.tasks)
          .find((t) => t.id === id) ||
        queryClient.getQueryData<TogetherTask[]>(togetherKeys.today())?.find((t) => t.id === id);

      if (!task || task.completed) return;
      if (isTaskFuture(task)) return; // 🔒 блокируем выполнение future-задач

      completeMutation.mutate(id);
    },
    [completeMutation, queryClient],
  );

  return {
    handleComplete,
    celebratedTaskId,
    isCompleting: completeMutation.isPending,
  };
}
