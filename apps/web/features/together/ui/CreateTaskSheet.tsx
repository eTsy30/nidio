"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Flag } from "lucide-react";
import { type SubmitHandler, useForm, useWatch } from "react-hook-form";

import { useAuth } from "@/shared/api/provider/auth-provider";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog/dialog";

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
  partnerId: string | undefined;
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

export function CreateTaskSheet({
  open,
  onClose,
  defaultColumnId,
  columns,
  partnerId,
}: CreateTaskSheetProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [dueMode, setDueMode] = useState<DueMode>("today");
  const [customDate, setCustomDate] = useState<string>("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    trigger,
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

  const createMutation = useMutation({
    retry: false,
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: togetherKeys.all });
      reset();
      setStep(0);
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
    if (!user || !partnerId || createMutation.isPending || (dueMode === "custom" && !customDate))
      return;

    let assigneeId: string | null = null;
    let rotationFirstAssigneeId: string | undefined = undefined;

    if (data.assignee === "ME") assigneeId = user.id;
    else if (data.assignee === "PARTNER") assigneeId = partnerId;
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

  const close = () => {
    if (createMutation.isPending) return;
    setStep(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent className="z-[60] flex max-h-[calc(100dvh-32px-env(safe-area-inset-bottom))] flex-col gap-3 overflow-hidden rounded-2xl sm:max-w-lg">
        <div className="shrink-0 pr-8">
          <DialogTitle>Новая задача</DialogTitle>
          <DialogDescription>
            Шаг {step + 1} из 2 · {step === 0 ? "Задача и участники" : "Срок и повторение"}
          </DialogDescription>
        </div>
        <form
          onSubmit={async (event) => {
            if (step === 0) {
              event.preventDefault();
              if (await trigger(["title", "columnId", "assignee"])) setStep(1);
            } else {
              await handleSubmit(onSubmit)(event);
            }
          }}
          className="flex min-h-0 flex-col gap-3 px-1 pb-1"
        >
          <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain px-1">
            {step === 0 && (
              <>
                {/* Column select */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Колонка</label>
                  <select
                    {...register("columnId")}
                    className={cn(
                      "h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus:border-primary",
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
                    disabled={createMutation.isPending}
                    className={cn(
                      "h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus:border-primary",
                      "disabled:opacity-50",
                      errors.title && "border-destructive",
                    )}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive font-medium mt-1.5">
                      {errors.title.message}
                    </p>
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
                  <select
                    {...register("assignee")}
                    disabled={createMutation.isPending}
                    className="h-11 w-full rounded-xl border bg-background px-3 text-base"
                  >
                    {assigneeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            {step === 1 && (
              <>
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
                              else setValue("rotationFirst", partnerId ?? "");
                            }}
                            className={cn(
                              "h-9 rounded-lg border text-sm font-medium transition-all",
                              (opt.value === "ME" && rotationFirst === user?.id) ||
                                (opt.value === "PARTNER" && rotationFirst === partnerId)
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
                      aria-label="Дата задачи"
                      required
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus:border-primary"
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
                    className="h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus:border-primary disabled:opacity-50"
                  >
                    {repeatOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            {createMutation.isError && (
              <p className="text-sm text-destructive font-medium text-center">
                Не удалось создать задачу. Попробуйте ещё раз.
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2 border-t pt-3">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              disabled={createMutation.isPending}
              onClick={() => (step === 0 ? close() : setStep(0))}
            >
              {step === 0 ? "Отмена" : "Назад"}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={
                createMutation.isPending ||
                (step === 1 && (!isValid || !partnerId || (dueMode === "custom" && !customDate)))
              }
              loading={createMutation.isPending}
            >
              {step === 0 ? "Далее" : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
