"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isPast, isToday } from "date-fns";
import { ru } from "date-fns/locale";
import { Flag, MoreVertical, Repeat } from "lucide-react";

import { togetherKeys } from "@/features/together/api/query-keys";
import { tasksApi } from "@/features/together/api/tasks.api";
import { cn } from "@/shared/lib/cn";
import { Checkbox } from "@/shared/ui/checkbox/Checkbox";

import { TogetherTask } from "../model/task.types";

interface TaskCardProps {
  task: TogetherTask;
  currentUserId: string;
}

function formatDue(dueAt: string | null): string {
  if (!dueAt) return "";
  const d = new Date(dueAt);
  if (isToday(d)) return `Сегодня`;
  return format(d, "d MMM", { locale: ru });
}

export function TaskCard({ task, currentUserId }: TaskCardProps) {
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);

  const isOverdue =
    task.dueAt && !task.completed && isPast(new Date(task.dueAt)) && !isToday(new Date(task.dueAt));
  const myCompletion = task.completions?.some((c) => c.userId === currentUserId);

  const completeMutation = useMutation({
    mutationFn: tasksApi.complete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: togetherKeys.board() }),
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: togetherKeys.board() }),
  });

  let assigneeLabel = "Вместе";
  if (task.assigneeMode === "ME") assigneeLabel = "Мне";
  else if (task.assigneeMode === "PARTNER") assigneeLabel = "Партнёру";
  else if (task.assigneeMode === "ROTATE") assigneeLabel = "По очереди";

  return (
    <div
      className={cn(
        "group relative bg-white rounded-2xl border p-3 shadow-sm",
        "transition-all duration-150 hover:shadow-md",
        task.priority && !task.completed && "ring-1 ring-amber-400",
        task.completed && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={task.completed || !!myCompletion}
            onCheckedChange={() => !task.completed && completeMutation.mutate(task.id)}
            disabled={task.completed || completeMutation.isPending}
            size="sm"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p
              className={cn(
                "text-sm font-medium leading-snug",
                task.completed && "line-through text-muted-foreground",
              )}
            >
              {task.title}
            </p>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((s) => !s);
                }}
                className="p-1 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-6 z-20 w-36 bg-card border rounded-xl shadow-lg p-1">
                  <button
                    onClick={() => {
                      deleteMutation.mutate(task.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg hover:bg-destructive/10 text-destructive text-left"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">{assigneeLabel}</span>

            {task.dueAt && (
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isOverdue ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {formatDue(task.dueAt)}
              </span>
            )}

            {task.repeat !== "NONE" && <Repeat className="w-3 h-3 text-muted-foreground" />}

            {task.priority && !task.completed && (
              <Flag className="w-3 h-3 text-amber-500 fill-amber-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
