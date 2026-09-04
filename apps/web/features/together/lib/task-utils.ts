import { differenceInCalendarDays, format, isAfter, isBefore, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";

import { TogetherTask } from "../model/task.types";

export type TaskTemporalState = "future" | "overdue" | "active" | "completed";

function getToday(): Date {
  return startOfDay(new Date());
}

function getTaskDay(task: TogetherTask): Date | null {
  if (!task.dueAt) {
    return null;
  }

  return startOfDay(new Date(task.dueAt));
}

export function isTaskCompleted(task: TogetherTask): boolean {
  return task.completed;
}

export function isTaskFuture(task: TogetherTask): boolean {
  if (task.completed) {
    return false;
  }

  const taskDay = getTaskDay(task);

  if (!taskDay) {
    return false;
  }

  return isAfter(taskDay, getToday());
}

export function isTaskOverdue(task: TogetherTask): boolean {
  if (task.completed) {
    return false;
  }

  const taskDay = getTaskDay(task);

  if (!taskDay) {
    return false;
  }

  return isBefore(taskDay, getToday());
}

export function isTaskActive(task: TogetherTask): boolean {
  return !task.completed;
}

export function getTaskTemporalState(task: TogetherTask): TaskTemporalState {
  if (isTaskCompleted(task)) {
    return "completed";
  }

  if (isTaskFuture(task)) {
    return "future";
  }

  if (isTaskOverdue(task)) {
    return "overdue";
  }

  return "active";
}

export function getTaskOverdueDays(task: TogetherTask): number {
  if (!isTaskOverdue(task)) {
    return 0;
  }

  const taskDay = getTaskDay(task);

  if (!taskDay) {
    return 0;
  }

  return differenceInCalendarDays(getToday(), taskDay);
}

export function formatFutureDate(dateStr: string): string {
  return `Будет доступно ${format(new Date(dateStr), "d MMMM", {
    locale: ru,
  })}`;
}

export function formatOverdueStatus(task: TogetherTask): string {
  const days = getTaskOverdueDays(task);

  if (days <= 1) {
    return "⚠ Просрочено";
  }

  return `⚠ Просрочено ${days} дня`;
}

export function partitionTasks(tasks: TogetherTask[]) {
  const active = tasks.filter(isTaskActive);
  const completed = tasks.filter(isTaskCompleted);

  return {
    active,
    completed,
  };
}
