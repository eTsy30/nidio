"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, Heart, MoreVertical, Repeat } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { Checkbox } from "@/shared/ui/checkbox/Checkbox";

import { togetherKeys } from "../api/query-keys";
import { tasksApi } from "../api/tasks.api";
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
  if (isToday(d)) return `Сегодня, ${format(d, "HH:mm")}`;
  if (isTomorrow(d)) return `Завтра, ${format(d, "HH:mm")}`;
  return format(d, "d MMM, HH:mm", { locale: ru });
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
  const isOverdue =
    task.dueAt && !task.completed && isPast(new Date(task.dueAt)) && !isToday(new Date(task.dueAt));
  const [showMenu, setShowMenu] = useState(false);

  const queryClient = useQueryClient();
  const nudgeMutation = useMutation({
    mutationFn: tasksApi.nudge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: togetherKeys.list() });
      setShowMenu(false);
    },
  });

  let assigneeLabel = "Вместе";
  if (task.assigneeId === currentUserId) assigneeLabel = "Мне";
  else if (task.assigneeId) assigneeLabel = partnerName || "Партнёру";

  const myCompletion = task.completions?.some((c) => c.userId === currentUserId);
  const partnerCompletion = task.completions?.some((c) => c.userId === partnerId);
  const isBoth = task.assigneeMode === "BOTH";
  const bothProgress = isBoth && !task.completed ? `${task.completions?.length ?? 0}/2` : null;

  const canNudge = task.assigneeId && task.assigneeId !== currentUserId && !task.completed;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-4",
        "rounded-3xl border border-border/60 bg-card",
        "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
        "transition-[opacity,transform,box-shadow]",
        "duration-150 ease-out cursor-pointer select-none",
        "hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)]",
        "active:scale-[0.99]",
        task.completed && "opacity-60",
        isCelebrated && "ring-2 ring-primary/30 scale-[1.02]",
      )}
    >
      <div className="shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={task.completed || !!myCompletion}
          onCheckedChange={() => onToggle(task.id)}
          disabled={disabled}
          size="md"
        />
      </div>

      <div className="flex-1 min-w-0">
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
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((s) => !s);
                }}
                className="p-1.5 rounded-full hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 z-20 w-40 bg-card border rounded-xl shadow-[var(--shadow-floating)] p-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nudgeMutation.mutate(task.id);
                    }}
                    disabled={nudgeMutation.isPending}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Heart className="w-4 h-4 text-primary" />
                    Напомнить
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2">
          <span className="text-xs font-medium text-muted-foreground">
            {assigneeLabel}
            {bothProgress && ` · ${bothProgress}`}
          </span>

          {task.dueAt && (
            <span
              className={cn(
                "text-xs font-medium",
                isOverdue ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {formatDue(task.dueAt)}
            </span>
          )}

          {task.repeat !== "NONE" && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Repeat className="w-3 h-3" />
              {task.repeat === "DAILY" && "Каждый день"}
              {task.repeat === "WEEKLY" && "Каждую неделю"}
              {task.repeat === "MONTHLY" && "Каждый месяц"}
            </span>
          )}
        </div>

        {isBoth && !task.completed && (
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full border",
                myCompletion
                  ? "bg-success/10 border-success text-success"
                  : "border-muted text-muted-foreground",
              )}
            >
              {myCompletion ? "✓ Вы" : "○ Вы"}
            </span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full border",
                partnerCompletion
                  ? "bg-success/10 border-success text-success"
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-in zoom-in duration-300">
            {isBoth ? "❤️ Выполнено вместе" : "✓ Готово"}
          </div>
        </div>
      )}
    </div>
  );
}
