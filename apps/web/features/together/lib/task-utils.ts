import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";

import { TogetherTask } from "../model/task.types";

export function isTaskOverdue(task: TogetherTask): boolean {
  if (!task.dueAt || task.completed) return false;
  return isBefore(new Date(task.dueAt), startOfDay(new Date()));
}

export function isTaskFuture(task: TogetherTask): boolean {
  if (!task.dueAt || task.completed) return false;
  return isAfter(startOfDay(new Date(task.dueAt)), startOfDay(new Date()));
}

export function formatFutureDate(dateStr: string): string {
  return `Будет доступно ${format(new Date(dateStr), "d MMMM", { locale: ru })}`;
}

export function partitionTasks(tasks: TogetherTask[]) {
  const active = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);
  return { active, completed };
}
