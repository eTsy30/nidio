"use client";

import { format, isToday } from "date-fns";
import { ru } from "date-fns/locale";
import { BellRing, CheckCircle2, CircleCheck, Flag, Pencil, Repeat, Trash2 } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { Checkbox } from "@/shared/ui/checkbox/Checkbox";

import { formatFutureDate, formatOverdueStatus } from "../lib/task-utils";
import { TogetherTask } from "../model/task.types";
import { useTaskCard } from "../model/use-task-card";

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
  const {
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
  } = useTaskCard({ task, currentUserId, partnerId, onEdit });

  return (
    <div
      aria-disabled={isCompleted || !canCompleteMyPart}
      onClick={handleComplete}
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

          {canNudge && (
            <button
              type="button"
              disabled={nudgeMutation.isPending}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                nudgeMutation.mutate(task.id);
              }}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary disabled:opacity-50"
            >
              <BellRing className="h-3.5 w-3.5" />
              {nudgeMutation.isPending ? "Отправляем…" : "Пни меня"}
            </button>
          )}

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
