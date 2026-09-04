"use client";

import { useEffect } from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Flag, X } from "lucide-react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { useAuth } from "@/shared/api/provider/auth-provider";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

import { Column } from "../api/board.api";
import { togetherKeys } from "../api/query-keys";
import { tasksApi } from "../api/tasks.api";
import { TogetherTask } from "../model/task.types";

interface EditTaskSheetProps {
  task: TogetherTask | null;
  open: boolean;
  onClose: () => void;
  columns: Column[];
}

const assigneeValues = ["ME", "PARTNER", "BOTH", "ROTATE"] as const;
const repeatValues = ["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const;

const editTaskSchema = z.object({
  title: z.string().min(1, "Введите название").max(255),
  assigneeMode: z.enum(assigneeValues), // ← было assignee
  repeat: z.enum(repeatValues),
  hasDueDate: z.boolean(),
  columnId: z.string().min(1),
  priority: z.boolean(),
  rotationFirst: z.string().optional(),
});

type EditTaskFormData = z.infer<typeof editTaskSchema>;

const assigneeOptions = [
  { value: "ME" as const, label: "Я" },
  { value: "PARTNER" as const, label: "Партнёр" },
  { value: "BOTH" as const, label: "Вместе" },
  { value: "ROTATE" as const, label: "По очереди" },
];

const repeatOptions = [
  { value: "NONE" as const, label: "Не повторять" },
  { value: "DAILY" as const, label: "Каждый день" },
  { value: "WEEKLY" as const, label: "Каждую неделю" },
  { value: "MONTHLY" as const, label: "Каждый месяц" },
];

export function EditTaskSheet({ task, open, onClose, columns }: EditTaskSheetProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isValid },
  } = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: "",
      assigneeMode: "ME",
      repeat: "NONE",
      hasDueDate: true,
      columnId: "",
      priority: false,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        assigneeMode: task.assigneeMode,
        repeat: task.repeat === "CUSTOM" ? "NONE" : task.repeat,
        hasDueDate: !!task.dueAt,
        columnId: task.columnId,
        priority: task.priority,
      });
    }
  }, [task, reset]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EditTaskFormData> }) =>
      tasksApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: togetherKeys.board() });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<EditTaskFormData> = (data) => {
    if (!task || !user) return;
    updateMutation.mutate({
      id: task.id,
      payload: {
        title: data.title.trim(),
        columnId: data.columnId,
        assigneeMode: data.assigneeMode,
        repeat: data.repeat,
        priority: data.priority,
      },
    });
  };

  const assignee = watch("assigneeMode");
  const priority = watch("priority");

  if (!open || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-overlay/60 backdrop-blur-sm"
        onClick={() => !updateMutation.isPending && onClose()}
      />
      <div
        className={cn(
          "relative w-full bg-card shadow-[var(--shadow-modal)]",
          "rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] sm:max-w-md sm:mx-4",
          "max-h-[85vh] overflow-y-auto",
          "animate-in slide-in-from-bottom duration-300 sm:animate-none",
          "px-4 pt-5 pb-8 sm:p-6",
        )}
      >
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Редактировать задачу</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{task.title}</p>
          </div>
          <button
            type="button"
            onClick={() => !updateMutation.isPending && onClose()}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Колонка</label>
            <select
              {...register("columnId")}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Название</label>
            <input
              {...register("title")}
              type="text"
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <button
            type="button"
            onClick={() => setValue("priority", !priority, { shouldValidate: true })}
            className={cn(
              "w-full h-11 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all",
              priority ? "border-amber-400 bg-amber-50 text-amber-700" : "hover:bg-muted",
            )}
          >
            <Flag className={cn("w-4 h-4", priority && "fill-amber-500 text-amber-500")} />
            {priority ? "Приоритетная" : "Отметить приоритетной"}
          </button>

          <div>
            <label className="mb-2 block text-sm font-medium">Кому?</label>
            <div className="grid grid-cols-4 gap-2">
              {assigneeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("assigneeMode", opt.value, { shouldValidate: true })}
                  className={cn(
                    "h-11 rounded-xl border p-2 text-center text-sm font-medium transition-all",
                    assignee === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "hover:bg-muted",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Повторение</label>
            <select
              {...register("repeat")}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              {repeatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => !updateMutation.isPending && onClose()}
              disabled={updateMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={!isValid || updateMutation.isPending}
              loading={updateMutation.isPending}
            >
              Сохранить
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
