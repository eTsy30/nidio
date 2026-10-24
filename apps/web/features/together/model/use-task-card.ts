"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { togetherKeys } from "../api/query-keys";
import { tasksApi } from "../api/tasks.api";
import { useNudge } from "../hooks/use-nudge";
import { getTaskTemporalState } from "../lib/task-utils";

import {
  findCachedTask,
  optimisticTask,
  replaceCachedTask,
  type TaskCache,
} from "./optimistic-task-cache";
import type { TogetherTask } from "./task.types";
interface TaskCardModelInput {
  task: TogetherTask;
  currentUserId: string;
  partnerId?: string | undefined;
  onEdit?: ((task: TogetherTask) => void) | undefined;
}

export function useTaskCard({ task, currentUserId, partnerId, onEdit }: TaskCardModelInput) {
  const queryClient = useQueryClient();
  const mutationKey = ["task-status"];
  const cacheKeys = [togetherKeys.board(), togetherKeys.today(), togetherKeys.list()];
  const optimisticOptions = (action: "complete" | "activate" | "delete") => ({
    mutationKey,
    onMutate: async (id: string) => {
      await Promise.all(cacheKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      const snapshots = cacheKeys.map((key) => ({
        key,
        data: queryClient.getQueryData<TaskCache>(key),
      }));
      for (const { key, data } of snapshots) {
        if (!data) continue;
        const cached = findCachedTask(data, id);
        if (cached)
          queryClient.setQueryData(
            key,
            replaceCachedTask(data, id, optimisticTask(cached, action, currentUserId)),
          );
      }
      return { snapshots };
    },
    onError: (
      _error: unknown,
      id: string,
      context: { snapshots: { key: readonly string[]; data: TaskCache | undefined }[] } | undefined,
    ) => {
      for (const { key, data } of context?.snapshots ?? []) {
        if (!data) continue;
        const previous = findCachedTask(data, id);
        if (previous)
          queryClient.setQueryData<TaskCache>(key, (current) =>
            current ? replaceCachedTask(current, id, previous, data) : current,
          );
      }
      toast.error("Не удалось сохранить задачу. Изменение отменено.");
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey }) === 1)
        void queryClient.invalidateQueries({ queryKey: togetherKeys.all });
    },
  });

  const temporalState = getTaskTemporalState(task);

  const isCompleted = temporalState === "completed";
  const isFuture = temporalState === "future";
  const isOverdue = temporalState === "overdue";

  const isCreator = task.createdById === currentUserId;
  const isTogetherTask = task.assigneeMode === "BOTH";

  const myCompletion = task.completions?.some((completion) => completion.userId === currentUserId);

  const partnerCompletion = task.completions?.some((completion) =>
    partnerId ? completion.userId === partnerId : completion.userId !== currentUserId,
  );
  const assigneeLabel = (() => {
    if (task.assigneeMode === "BOTH") {
      return "Вместе";
    }

    if (task.assigneeMode === "ROTATE") {
      return "По очереди";
    }

    if (isCreator) {
      return task.assigneeMode === "ME" ? "Мне" : "Партнёру";
    }

    return task.assigneeMode === "ME" ? "Партнёру" : "Мне";
  })();

  const canCompleteMyPart =
    !isCompleted && !isFuture && (isTogetherTask || task.assigneeId === currentUserId);

  const completeMutation = useMutation({
    retry: false,
    mutationFn: tasksApi.complete,

    ...optimisticOptions("complete"),
  });

  const activateMutation = useMutation({
    retry: false,
    mutationFn: tasksApi.activate,

    ...optimisticOptions("activate"),
  });

  const deleteMutation = useMutation({
    retry: false,
    mutationFn: tasksApi.remove,

    ...optimisticOptions("delete"),
  });

  const canNudge =
    isCreator &&
    !isCompleted &&
    !isTogetherTask &&
    Boolean(task.assigneeId) &&
    task.assigneeId !== currentUserId;
  const nudgeMutation = useNudge();

  const canActivate = isCompleted && task.repeat === "NONE" && task.recurringGroupId === null;

  const handleComplete = () => {
    if (
      !canCompleteMyPart ||
      completeMutation.isPending ||
      activateMutation.isPending ||
      deleteMutation.isPending
    ) {
      return;
    }

    if (isTogetherTask && myCompletion) {
      return;
    }

    completeMutation.mutate(task.id);
  };

  const handleEdit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!isCreator || isCompleted) {
      return;
    }

    onEdit?.(task);
  };

  const handleActivate = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (
      !canActivate ||
      activateMutation.isPending ||
      completeMutation.isPending ||
      deleteMutation.isPending
    ) {
      return;
    }

    activateMutation.mutate(task.id);
  };

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (deleteMutation.isPending || completeMutation.isPending || activateMutation.isPending) {
      return;
    }

    deleteMutation.mutate(task.id);
  };

  return {
    isCompleted,
    isFuture,
    isOverdue,
    isCreator,
    isTogetherTask,
    myCompletion,
    partnerCompletion,
    assigneeLabel,
    canCompleteMyPart,
    completeMutation,
    activateMutation,
    deleteMutation,
    canNudge,
    nudgeMutation,
    canActivate,
    handleComplete,
    handleEdit,
    handleActivate,
    handleDelete,
  };
}
