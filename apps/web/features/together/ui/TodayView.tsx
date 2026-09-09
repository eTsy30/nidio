"use client";

import { useQuery } from "@tanstack/react-query";

import { useCurrentCouple } from "@/features/relationship/hook/use-relationship";
import { togetherKeys } from "@/features/together/api/query-keys";
import { tasksApi } from "@/features/together/api/tasks.api";
import { useAuth } from "@/shared/api/provider/auth-provider";
import { cn } from "@/shared/lib/cn";

import { TogetherTask } from "../model/task.types";

import { TaskCard } from "./TaskCard";

function isOverdue(task: TogetherTask): boolean {
  if (!task.dueAt || task.completed) return false;
  const d = new Date(task.dueAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function isDueToday(task: TogetherTask): boolean {
  if (!task.dueAt || task.completed) return false;
  const d = new Date(task.dueAt);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function TodayView() {
  const { user } = useAuth();
  const { data: relationship } = useCurrentCouple();

  const currentUserId = user?.id ?? "";
  const partnerId = relationship?.partnerId;

  const { data: tasks = [] } = useQuery({
    queryKey: togetherKeys.today(),
    queryFn: tasksApi.getToday,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

  const overdue = tasks.filter(isOverdue);
  const todayTasks = tasks.filter(
    (t) => !isOverdue(t) && (isDueToday(t) || t.assigneeMode === "BOTH"),
  );
  const important = tasks.filter((t) => t.assigneeMode === "BOTH" && !t.completed);

  const renderSection = (title: string, items: TogetherTask[], accent?: boolean) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-3">
        <h3
          className={cn(
            "text-xs font-semibold uppercase tracking-wider px-1",
            accent ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {title} · {items.length}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              currentUserId={currentUserId}
              partnerId={partnerId}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-6">
      {renderSection("Просрочено", overdue, true)}
      {renderSection("Важно", important)}
      {renderSection("Сегодня", todayTasks)}

      {tasks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <p className="text-lg font-medium mb-1">Всё сделано ✨</p>
          <p>Нет задач, требующих внимания</p>
        </div>
      )}
    </div>
  );
}
