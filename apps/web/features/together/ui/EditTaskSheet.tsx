"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Flag } from "lucide-react";
import { type SubmitHandler, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { useAuth } from "@/shared/api/provider/auth-provider";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog/dialog";

import { Column } from "../api/board.api";
import { togetherKeys } from "../api/query-keys";
import { tasksApi, UpdateTaskPayload } from "../api/tasks.api";
import { TogetherTask } from "../model/task.types";

interface EditTaskSheetProps {
  task: TogetherTask | null;
  open: boolean;
  onClose: () => void;
  columns: Column[];
  partnerId: string | undefined;
}

const assigneeValues = ["ME", "PARTNER", "BOTH", "ROTATE"] as const;
const repeatValues = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "CUSTOM"] as const;

const editTaskSchema = z.object({
  title: z.string().trim().min(1, "Введите название").max(255),
  description: z.string(),
  dueDate: z.string(),
  assigneeMode: z.enum(assigneeValues),
  repeat: z.enum(repeatValues),
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
  { value: "CUSTOM" as const, label: "Своё повторение" },
];

export function EditTaskSheet({ task, open, onClose, columns, partnerId }: EditTaskSheetProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { isValid },
  } = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      assigneeMode: "ME",
      repeat: "NONE",
      columnId: "",
      priority: false,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? "",
        dueDate: task.dueAt ? format(new Date(task.dueAt), "yyyy-MM-dd") : "",
        rotationFirst: task.rotationFirstAssigneeId ?? task.createdById,
        assigneeMode: task.assigneeMode,
        repeat: task.repeat,
        columnId: task.columnId,
        priority: task.priority,
      });
    }
  }, [task, reset]);

  const updateMutation = useMutation({
    retry: false,
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      tasksApi.update(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: togetherKeys.all,
      });

      onClose();
    },
  });

  const onSubmit: SubmitHandler<EditTaskFormData> = (data) => {
    if (!task || !user) return;
    updateMutation.mutate({
      id: task.id,
      payload: {
        title: data.title.trim(),
        description: data.description.trim() || null,
        dueAt: data.dueDate ? new Date(`${data.dueDate}T00:00:00`).toISOString() : null,
        ...(data.assigneeMode === "ROTATE" &&
        data.rotationFirst &&
        data.rotationFirst !== task.rotationFirstAssigneeId
          ? { rotationFirstAssigneeId: data.rotationFirst }
          : {}),
        columnId: data.columnId,
        assigneeMode: data.assigneeMode,
        repeat: data.repeat,
        priority: data.priority,
      },
    });
  };

  const [assignee, priority] = useWatch({ control, name: ["assigneeMode", "priority"] });

  if (!open || !task) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !updateMutation.isPending && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl p-5 sm:max-w-md">
        <div className="pr-8">
          <DialogTitle>Редактировать задачу</DialogTitle>
          <DialogDescription>{task.title}</DialogDescription>
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

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Описание</span>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full rounded-xl border bg-background p-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Дата задачи</span>
            <input
              type="date"
              {...register("dueDate")}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Оставьте пустым, если срока нет.
            </span>
          </label>

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

          {assignee === "ROTATE" && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Первым выполняет</span>
              <select
                {...register("rotationFirst")}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
              >
                <option value={user?.id}>Я</option>
                <option value={partnerId}>Партнёр</option>
              </select>
            </label>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">Повторение</label>
            <select
              {...register("repeat")}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              {repeatOptions
                .filter((opt) => opt.value !== "CUSTOM" || task.repeat === "CUSTOM")
                .map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
            </select>
          </div>

          {updateMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              Не удалось сохранить задачу. Проверьте данные и попробуйте ещё раз.
            </p>
          )}

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
      </DialogContent>
    </Dialog>
  );
}
