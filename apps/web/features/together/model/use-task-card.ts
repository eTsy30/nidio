"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { togetherKeys } from "../api/query-keys";
import { tasksApi } from "../api/tasks.api";
import { useNudge } from "../hooks/use-nudge";
import { getTaskTemporalState } from "../lib/task-utils";

import type { TogetherTask } from "./task.types";
interface TaskCardModelInput {
  task: TogetherTask;
  currentUserId: string;
  partnerId?: string | undefined;
  onEdit?: ((task: TogetherTask) => void) | undefined;
}

export function useTaskCard({ task, currentUserId, partnerId, onEdit }: TaskCardModelInput) {
  const queryClient = useQueryClient();
  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: togetherKeys.all });
  };

  const temporalState = getTaskTemporalState(task);

  const isCompleted = temporalState === "completed";
  const isFuture = temporalState === "future";
  const isOverdue = temporalState === "overdue";

  const isCreator = task.createdById === currentUserId;
  const isTogetherTask = task.assigneeMode === "BOTH";

  /*
   * Для BOTH assigneeId === null.
   *
   * Поэтому определяем выполнение каждой стороны
   * только через task.completions.
   */
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

  /*
   * Для BOTH каждый участник может выполнить свою часть.
   * Для остальных режимов выполнить задачу может только assignee.
   */
  const canCompleteMyPart =
    !isCompleted && !isFuture && (isTogetherTask || task.assigneeId === currentUserId);

  const completeMutation = useMutation({
    retry: false,
    mutationFn: tasksApi.complete,

    onSuccess: invalidateTasks,
  });

  const activateMutation = useMutation({
    retry: false,
    mutationFn: tasksApi.activate,

    onSuccess: invalidateTasks,
  });

  const deleteMutation = useMutation({
    retry: false,
    mutationFn: tasksApi.remove,

    onSuccess: invalidateTasks,
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
    if (!canCompleteMyPart || completeMutation.isPending) {
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

    if (!canActivate || activateMutation.isPending) {
      return;
    }

    activateMutation.mutate(task.id);
  };

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (deleteMutation.isPending) {
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
