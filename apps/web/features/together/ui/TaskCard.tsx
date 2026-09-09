"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { ru } from "date-fns/locale";
import { CheckCircle2, CircleCheck, Flag, Pencil, Repeat, Trash2 } from "lucide-react";

import { togetherKeys } from "@/features/together/api/query-keys";
import { tasksApi } from "@/features/together/api/tasks.api";
import { cn } from "@/shared/lib/cn";
import { Checkbox } from "@/shared/ui/checkbox/Checkbox";

import { formatFutureDate, formatOverdueStatus, getTaskTemporalState } from "../lib/task-utils";
import { TogetherTask } from "../model/task.types";

interface TaskCardProps {
  task: TogetherTask;
  currentUserId: string;
  partnerId?: string | undefined;
  partnerName?: string | undefined;
  partnerAvatarUrl?: string | null | undefined;
  onEdit?: ((task: TogetherTask) => void) | undefined;
}

function formatDue(dueAt: string | null): string {
  if (!dueAt) return "";

  const d = new Date(dueAt);

  if (isToday(d)) {
    return "Сегодня";
  }

  return format(d, "d MMM", { locale: ru });
}

export function TaskCard({ task, currentUserId, partnerId, onEdit }: TaskCardProps) {
  const queryClient = useQueryClient();

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
    mutationFn: tasksApi.complete,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: togetherKeys.all,
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: tasksApi.activate,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: togetherKeys.all,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.remove,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: togetherKeys.all,
      });
    },
  });

  const canActivate = isCompleted && task.repeat === "NONE" && task.recurringGroupId === null;

  const handleCardClick = () => {
    if (!canCompleteMyPart || completeMutation.isPending) {
      return;
    }

    /*
     * Если пользователь уже выполнил свою часть BOTH,
     * повторно complete не отправляем.
     */
    if (isTogetherTask && myCompletion) {
      return;
    }

    completeMutation.mutate(task.id);
  };

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

  return (
    <div
      aria-disabled={isCompleted || !canCompleteMyPart}
      onClick={handleCardClick}
      className={cn(
        "group relative rounded-2xl border p-3 shadow-sm",
        "transition-all duration-150",
        "pr-10",

        canCompleteMyPart && !isCompleted && "cursor-pointer hover:shadow-md",

        !canCompleteMyPart && !isCompleted && "cursor-default",

        isCompleted && "opacity-60 select-none",

        isOverdue && "border-destructive/40 bg-destructive/5",

        isFuture && "border-border/70 bg-muted/20",

        task.priority && !task.completed && !isOverdue && "ring-1 ring-amber-400",

        task.priority && !task.completed && isOverdue && "ring-1 ring-destructive/30",
      )}
    >
      {/* Actions */}
      <div
        className={cn(
          "absolute right-2 top-1/2 z-10",
          "-translate-y-1/2",
          "flex flex-col gap-1",
          "transition-opacity duration-150",
          "opacity-0 group-hover:opacity-100",
          "max-sm:opacity-100",
        )}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {isCreator && !isCompleted && (
          <button
            type="button"
            aria-label="Редактировать задачу"
            title="Редактировать"
            onClick={handleEdit}
            className={cn(
              "flex h-6 w-6 items-center justify-center",
              "rounded-md",
              "text-muted-foreground",
              "hover:bg-muted hover:text-foreground",
              "transition-colors",
              "touch-manipulation",
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}

        {canActivate && (
          <button
            type="button"
            aria-label="Сделать задачу активной"
            title="Сделать активной"
            disabled={activateMutation.isPending}
            onClick={handleActivate}
            className={cn(
              "flex h-6 w-6 items-center justify-center",
              "rounded-md",
              "text-muted-foreground",
              "hover:bg-muted hover:text-foreground",
              "transition-colors",
              "disabled:pointer-events-none disabled:opacity-50",
              "touch-manipulation",
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          aria-label="Удалить задачу"
          title="Удалить"
          disabled={deleteMutation.isPending}
          onClick={handleDelete}
          className={cn(
            "flex h-6 w-6 items-center justify-center",
            "rounded-md",
            "text-muted-foreground",
            "hover:bg-destructive/10 hover:text-destructive",
            "transition-colors",
            "disabled:pointer-events-none disabled:opacity-50",
            "touch-manipulation",
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-start gap-2">
        {/* Main checkbox */}
        <div
          className="mt-0.5 shrink-0"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Checkbox
            checked={isTogetherTask ? Boolean(myCompletion) : task.completed}
            onCheckedChange={handleComplete}
            disabled={
              !canCompleteMyPart ||
              completeMutation.isPending ||
              (isTogetherTask && Boolean(myCompletion))
            }
            size="sm"
          />
        </div>

        <div className="min-w-0 flex-1">
          {/* Title */}
          <div className="flex items-start justify-between gap-1">
            <p
              className={cn(
                "text-sm font-medium leading-snug",
                task.completed && "line-through text-muted-foreground",
              )}
            >
              {task.title}
            </p>
          </div>

          {/* Meta */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">{assigneeLabel}</span>

            {isFuture && task.dueAt && (
              <span className="text-[11px] font-medium text-muted-foreground">
                {formatFutureDate(task.dueAt)}
              </span>
            )}

            {isOverdue && (
              <span className="text-[11px] font-semibold text-destructive">
                {formatOverdueStatus(task)}
              </span>
            )}

            {!isFuture && !isOverdue && task.dueAt && (
              <span className="text-[11px] font-medium text-muted-foreground">
                {formatDue(task.dueAt)}
              </span>
            )}

            {task.repeat !== "NONE" && <Repeat className="h-3 w-3 text-muted-foreground" />}

            {task.priority && !task.completed && (
              <Flag className="h-3 w-3 fill-amber-500 text-amber-500" />
            )}
          </div>

          {/* BOTH participants status */}
          {isTogetherTask && (
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  "text-[10px] font-medium",
                  myCompletion ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {myCompletion ? (
                  <CircleCheck className="h-3 w-3" />
                ) : (
                  <span className="text-[12px] leading-none">○</span>
                )}
                Я
              </span>

              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  "text-[10px] font-medium",
                  partnerCompletion ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {partnerCompletion ? (
                  <CircleCheck className="h-3 w-3" />
                ) : (
                  <span className="text-[12px] leading-none">○</span>
                )}
                Партнёр
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
