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

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const completeMutation = useMutation({
    retry: false,
    mutationFn: tasksApi.complete,

    onMutate: async (taskId) => {
      await queryClient.cancelQueries({
        queryKey: togetherKeys.board(),
      });

      await queryClient.cancelQueries({
        queryKey: togetherKeys.today(),
      });

      const previousBoard = queryClient.getQueryData<Board>(togetherKeys.board());

      const previousToday = queryClient.getQueryData<TogetherTask[]>(togetherKeys.today());

      queryClient.setQueryData<Board>(togetherKeys.board(), (old) => {
        if (!old) {
          return old;
        }

        return {
          ...old,
          columns: old.columns.map((column) => ({
            ...column,
            tasks: column.tasks.map((task) =>
              task.id === taskId && task.assigneeMode !== "BOTH"
                ? { ...task, completed: true }
                : task,
            ),
          })),
        };
      });

      queryClient.setQueryData<TogetherTask[]>(togetherKeys.today(), (old) => {
        if (!old) {
          return old;
        }

        return old.map((task) =>
          task.id === taskId && task.assigneeMode !== "BOTH" ? { ...task, completed: true } : task,
        );
      });

      return {
        previousBoard,
        previousToday,
      };
    },

    onError: (_error, _taskId, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(togetherKeys.board(), context.previousBoard);
      }

      if (context?.previousToday) {
        queryClient.setQueryData(togetherKeys.today(), context.previousToday);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: togetherKeys.all,
      });
    },

    onSuccess: (task) => {
      if (!task.completed) {
        return;
      }

      setCelebratedTaskId(task.id);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setCelebratedTaskId(null);
      }, 1500);
    },
  });

  const handleComplete = useCallback(
    (id: string) => {
      const task =
        queryClient
          .getQueryData<Board>(togetherKeys.board())
          ?.columns.flatMap((column) => column.tasks)
          .find((task) => task.id === id) ??
        queryClient
          .getQueryData<TogetherTask[]>(togetherKeys.today())
          ?.find((task) => task.id === id);

      if (!task || task.completed) {
        return;
      }

      if (isTaskFuture(task)) {
        return;
      }

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
