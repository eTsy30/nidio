import type { Board } from "../api/board.api";

import type { TogetherTask } from "./task.types";

export type TaskCache = Board | TogetherTask[];
export function findCachedTask(data: TaskCache, id: string): TogetherTask | undefined {
  return (Array.isArray(data) ? data : data.columns.flatMap((column) => column.tasks)).find(
    (task) => task.id === id,
  );
}

// Restore only this task, not the entire snapshot: other pending edits must survive.
export function replaceCachedTask(
  data: TaskCache,
  id: string,
  next: TogetherTask | null,
  previous?: TaskCache,
): TaskCache {
  function replace(tasks: TogetherTask[], before?: TogetherTask[]) {
    if (tasks.some((task) => task.id === id))
      return tasks.flatMap((task) => (task.id === id ? (next ? [next] : []) : [task]));
    const index = before?.findIndex((task) => task.id === id) ?? -1;
    if (next && index >= 0) {
      const result = [...tasks];
      result.splice(Math.min(index, result.length), 0, next);
      return result;
    }
    return tasks;
  }
  if (Array.isArray(data)) return replace(data, Array.isArray(previous) ? previous : undefined);
  return {
    ...data,
    columns: data.columns.map((column) => ({
      ...column,
      tasks: replace(
        column.tasks,
        previous && !Array.isArray(previous)
          ? previous.columns.find((item) => item.id === column.id)?.tasks
          : undefined,
      ),
    })),
  };
}

export function optimisticTask(
  task: TogetherTask,
  action: "complete" | "activate" | "delete",
  userId: string,
): TogetherTask | null {
  if (action === "delete") return null;
  if (action === "activate")
    return { ...task, completed: false, completedAt: null, completions: [] };
  const completions = task.completions.some((item) => item.userId === userId)
    ? task.completions
    : [...task.completions, { userId }];
  const completed = task.assigneeMode !== "BOTH" || completions.length >= 2;
  return {
    ...task,
    completions,
    completed,
    completedAt: completed ? new Date().toISOString() : null,
  };
}
