"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Flag, X } from "lucide-react";
import { type SubmitHandler, useForm, useWatch } from "react-hook-form";

import { useCurrentCouple } from "@/features/relationship/hook/use-relationship";
import { useAuth } from "@/shared/api/provider/auth-provider";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

import { Column } from "../api/board.api";
import { togetherKeys } from "../api/query-keys";
import { tasksApi } from "../api/tasks.api";
import { CreateTaskFormData, createTaskSchema } from "../model/create-task.schema";

type DueMode = "today" | "tomorrow" | "custom" | "none";
type RepeatOption = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

interface CreateTaskSheetProps {
  open: boolean;
  onClose: () => void;
  defaultColumnId: string | undefined;
  columns: Column[];
}

const assigneeOptions = [
  { value: "ME" as const, label: "Я" },
  { value: "PARTNER" as const, label: "Партнёр" },
  { value: "BOTH" as const, label: "Вместе" },
  { value: "ROTATE" as const, label: "По очереди" },
];

const repeatOptions: { value: RepeatOption; label: string }[] = [
  { value: "NONE", label: "Не повторять" },
  { value: "DAILY", label: "Каждый день" },
  { value: "WEEKLY", label: "Каждую неделю" },
  { value: "MONTHLY", label: "Каждый месяц" },
];

export function CreateTaskSheet({ open, onClose, defaultColumnId, columns }: CreateTaskSheetProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: relationship } = useCurrentCouple();

  const [dueMode, setDueMode] = useState<DueMode>("today");
  const [customDate, setCustomDate] = useState<string>("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    setFocus,
    formState: { errors, isValid },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      assignee: "ME",
      repeat: "NONE",
      hasDueDate: true,
      columnId: defaultColumnId ?? columns[0]?.id ?? "",
      priority: false,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (defaultColumnId) setValue("columnId", defaultColumnId, { shouldValidate: true });
  }, [defaultColumnId, setValue]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setFocus("title"), 50);
      return () => clearTimeout(t);
    }
  }, [open, setFocus]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const createMutation = useMutation({
    retry: false,
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: togetherKeys.all });
      reset();
      setDueMode("today");
      setCustomDate("");
      onClose();
    },
  });

  const getDueAt = (): string | undefined => {
    if (dueMode === "none") return undefined;
    if (dueMode === "today") return new Date().toISOString();
    if (dueMode === "tomorrow") return addDays(new Date(), 1).toISOString();
    return customDate ? new Date(`${customDate}T00:00:00`).toISOString() : undefined;
  };

  const onSubmit: SubmitHandler<CreateTaskFormData> = (data) => {
    if (!user || !relationship) return;

    let assigneeId: string | null = null;
    let rotationFirstAssigneeId: string | undefined = undefined;

    if (data.assignee === "ME") assigneeId = user.id;
    else if (data.assignee === "PARTNER") assigneeId = relationship.partnerId;
    else if (data.assignee === "ROTATE") {
      rotationFirstAssigneeId = data.rotationFirst || user.id;
      assigneeId = rotationFirstAssigneeId;
    }

    createMutation.mutate({
      title: data.title.trim(),
      columnId: data.columnId,
      assigneeId,
      assigneeMode: data.assignee,
      ...(rotationFirstAssigneeId ? { rotationFirstAssigneeId } : {}),
      dueAt: getDueAt() ?? null,
      repeat: data.repeat as RepeatOption,
      priority: data.priority,
    });
  };

  const [assignee, priority, rotationFirst] = useWatch({
    control,
    name: ["assignee", "priority", "rotationFirst"],
  });
  const isRotate = assignee === "ROTATE";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-overlay/60 backdrop-blur-sm"
        onClick={() => !createMutation.isPending && onClose()}
      />
      <div
        className={cn(
          "relative w-full bg-card shadow-[var(--shadow-modal)]",
          "rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] sm:max-w-md sm:mx-4",
          "max-h-[85vh] sm:max-h-[90vh] overflow-y-auto",
          "animate-in slide-in-from-bottom duration-300 sm:animate-none",
          "px-4 pt-5 pb-8 sm:p-6",
        )}
      >
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Новая задача</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Добавьте задачу в колонку</p>
          </div>
          <button
            type="button"
            onClick={() => !createMutation.isPending && onClose()}
            className="p-2 rounded-full hover:bg-muted transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Column select */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Колонка</label>
            <select
              {...register("columnId")}
              className={cn(
                "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary",
                errors.columnId && "border-destructive",
              )}
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
            {errors.columnId && (
              <p className="text-xs text-destructive font-medium mt-1.5">
                {errors.columnId.message}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Что нужно сделать?</label>
            <input
              {...register("title")}
              type="text"
              placeholder="Например, купить молоко"
              autoComplete="off"
              autoFocus
              disabled={createMutation.isPending}
              className={cn(
                "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary",
                "disabled:opacity-50",
                errors.title && "border-destructive",
              )}
            />
            {errors.title && (
              <p className="text-xs text-destructive font-medium mt-1.5">{errors.title.message}</p>
            )}
          </div>

          {/* Priority */}
          <button
            type="button"
            onClick={() => setValue("priority", !priority, { shouldValidate: true })}
            className={cn(
              "w-full h-11 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all",
              priority ? "border-amber-400 bg-amber-50 text-amber-700" : "hover:bg-muted",
            )}
          >
            <Flag className={cn("w-4 h-4", priority && "fill-amber-500 text-amber-500")} />
            {priority ? "Приоритетная задача" : "Отметить приоритетной"}
          </button>

          {/* Assignee */}
          <div>
            <label className="mb-2 block text-sm font-medium">Кому?</label>
            <div className="grid grid-cols-4 gap-2">
              {assigneeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={createMutation.isPending}
                  onClick={() => setValue("assignee", opt.value, { shouldValidate: true })}
                  className={cn(
                    "h-11 rounded-xl border p-2 text-center text-sm font-medium transition-all",
                    "disabled:opacity-50",
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

          {/* Rotation settings */}
          {isRotate && (
            <div className="rounded-xl bg-muted/50 p-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Настройка ротации
              </p>
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">Первым:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "ME" as const, label: "Я" },
                    { value: "PARTNER" as const, label: "Партнёр" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (opt.value === "ME") setValue("rotationFirst", user?.id ?? "");
                        else setValue("rotationFirst", relationship?.partnerId ?? "");
                      }}
                      className={cn(
                        "h-9 rounded-lg border text-sm font-medium transition-all",
                        (opt.value === "ME" && rotationFirst === user?.id) ||
                          (opt.value === "PARTNER" && rotationFirst === relationship?.partnerId)
                          ? "border-primary bg-primary/5 text-primary"
                          : "hover:bg-muted",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="mb-2 block text-sm font-medium">Когда?</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[
                { key: "today" as DueMode, label: "Сегодня" },
                { key: "tomorrow" as DueMode, label: "Завтра" },
                { key: "custom" as DueMode, label: "Выбрать" },
                { key: "none" as DueMode, label: "Без срока" },
              ].map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDueMode(d.key)}
                  className={cn(
                    "h-11 rounded-xl border text-sm font-medium transition-all",
                    dueMode === d.key
                      ? "border-primary bg-primary/5 text-primary"
                      : "hover:bg-muted",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {dueMode === "custom" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            )}
            {dueMode === "today" && (
              <div className="h-11 flex items-center px-3 rounded-xl bg-muted text-sm text-muted-foreground">
                {format(new Date(), "d MMMM yyyy", { locale: ru })}
              </div>
            )}
            {dueMode === "tomorrow" && (
              <div className="h-11 flex items-center px-3 rounded-xl bg-muted text-sm text-muted-foreground">
                {format(addDays(new Date(), 1), "d MMMM yyyy", { locale: ru })}
              </div>
            )}
          </div>

          {/* Repeat */}
          <div>
            <label className="mb-2 block text-sm font-medium">Повторение</label>
            <select
              {...register("repeat")}
              disabled={createMutation.isPending}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-50"
            >
              {repeatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-destructive font-medium text-center">
              Не удалось создать задачу. Попробуйте ещё раз.
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => !createMutation.isPending && onClose()}
              disabled={createMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={!isValid || createMutation.isPending}
              loading={createMutation.isPending}
            >
              Создать
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
