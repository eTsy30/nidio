"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isTomorrow } from "date-fns";
import { ru } from "date-fns/locale";
import { Heart, MoreVertical, Repeat } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { Checkbox } from "@/shared/ui/checkbox/Checkbox";

import { togetherKeys } from "../api/query-keys";
import { tasksApi } from "../api/tasks.api";
import { formatFutureDate, formatOverdueStatus, getTaskTemporalState } from "../lib/task-utils";
import { TogetherTask } from "../model/task.types";

interface TaskItemProps {
  task: TogetherTask;
  currentUserId: string;
  partnerName?: string | undefined;
  partnerId?: string | undefined;
  onToggle: (id: string) => void;
  disabled?: boolean | undefined;
  isCelebrated?: boolean;
}

function formatDue(dueAt: string): string {
  const d = new Date(dueAt);

  if (isToday(d)) {
    return `Сегодня, ${format(d, "HH:mm")}`;
  }

  if (isTomorrow(d)) {
    return `Завтра, ${format(d, "HH:mm")}`;
  }

  return format(d, "d MMM, HH:mm", {
    locale: ru,
  });
}

export function TaskItem({
  task,
  currentUserId,
  partnerName,
  partnerId,
  onToggle,
  disabled,
  isCelebrated,
}: TaskItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  const queryClient = useQueryClient();

  const temporalState = getTaskTemporalState(task);

  const isCompleted = temporalState === "completed";
  const isFuture = temporalState === "future";
  const isOverdue = temporalState === "overdue";

  const nudgeMutation = useMutation({
    mutationFn: tasksApi.nudge,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: togetherKeys.list(),
      });

      setShowMenu(false);
    },
  });

  let assigneeLabel = "Вместе";

  if (task.assigneeId === currentUserId) {
    assigneeLabel = "Мне";
  } else if (task.assigneeId) {
    assigneeLabel = partnerName || "Партнёру";
  }

  const myCompletion = task.completions?.some((completion) => completion.userId === currentUserId);

  const partnerCompletion = task.completions?.some((completion) => completion.userId === partnerId);

  const isBoth = task.assigneeMode === "BOTH";

  const bothProgress = isBoth && !task.completed ? `${task.completions?.length ?? 0}/2` : null;

  const canNudge = !!task.assigneeId && task.assigneeId !== currentUserId && !task.completed;

  const handleToggle = () => {
    if (isCompleted || isFuture || disabled) {
      return;
    }

    onToggle(task.id);
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-3xl border p-4",
        "border-border/60 bg-card",
        "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
        "transition-[opacity,transform,box-shadow]",
        "duration-150 ease-out cursor-pointer select-none",
        "hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)]",
        "active:scale-[0.99]",

        isCompleted && "opacity-60",

        isFuture && "border-border/70 bg-muted/20",

        isOverdue && "border-destructive/40 bg-destructive/5",

        isCelebrated && "ring-2 ring-primary/30 scale-[1.02]",
      )}
    >
      <div className="mt-0.5 shrink-0" onClick={(event) => event.stopPropagation()}>
        <Checkbox
          checked={task.completed || !!myCompletion}
          onCheckedChange={handleToggle}
          disabled={isCompleted || isFuture || disabled}
          size="md"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-[15px] font-medium leading-snug tracking-tight",
              task.completed && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </p>

          {canNudge && (
            <div className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowMenu((state) => !state);
                }}
                className="rounded-full p-1.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border bg-card p-1 shadow-[var(--shadow-floating)]">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      nudgeMutation.mutate(task.id);
                    }}
                    disabled={nudgeMutation.isPending}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <Heart className="h-4 w-4 text-primary" />
                    Напомнить
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            {assigneeLabel}
            {bothProgress && ` · ${bothProgress}`}
          </span>

          {isFuture && task.dueAt && (
            <span className="text-xs font-medium text-muted-foreground">
              {formatFutureDate(task.dueAt)}
            </span>
          )}

          {isOverdue && (
            <span className="text-xs font-semibold text-destructive">
              {formatOverdueStatus(task)}
            </span>
          )}

          {!isFuture && !isOverdue && task.dueAt && (
            <span className="text-xs font-medium text-muted-foreground">
              {formatDue(task.dueAt)}
            </span>
          )}

          {task.repeat !== "NONE" && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Repeat className="h-3 w-3" />

              {task.repeat === "DAILY" && "Каждый день"}
              {task.repeat === "WEEKLY" && "Каждую неделю"}
              {task.repeat === "MONTHLY" && "Каждый месяц"}
            </span>
          )}
        </div>

        {isBoth && !task.completed && (
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-1.5 py-0.5 text-[10px]",
                myCompletion
                  ? "border-success bg-success/10 text-success"
                  : "border-muted text-muted-foreground",
              )}
            >
              {myCompletion ? "✓ Вы" : "○ Вы"}
            </span>

            <span
              className={cn(
                "rounded-full border px-1.5 py-0.5 text-[10px]",
                partnerCompletion
                  ? "border-success bg-success/10 text-success"
                  : "border-muted text-muted-foreground",
              )}
            >
              {partnerCompletion
                ? `✓ ${partnerName || "Партнёр"}`
                : `○ ${partnerName || "Партнёр"}`}
            </span>
          </div>
        )}
      </div>

      {isCelebrated && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-in zoom-in rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg duration-300">
            {isBoth ? "❤️ Выполнено вместе" : "✓ Готово"}
          </div>
        </div>
      )}
    </div>
  );
}
