import { api } from "@/shared/api/client/api";

import { TaskRepeat, TodaySummary, TogetherTask } from "../model/task.types";

export type AssigneeType = "ME" | "PARTNER" | "BOTH" | "ROTATE";

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  columnId: string;
  assigneeId?: string | null;
  assigneeMode?: AssigneeType;
  rotationFirstAssigneeId?: string | null;
  dueAt?: string | null;
  repeat?: TaskRepeat;
  repeatUntil?: string | null;
  repeatConfig?: Record<string, unknown>;
  priority?: boolean;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export const tasksApi = {
  getAll: () => api.get<TogetherTask[]>("/tasks").then((res) => res.data),

  getToday: () => api.get<TogetherTask[]>("/tasks/today").then((res) => res.data),

  getSummary: () => api.get<TodaySummary>("/tasks/summary").then((res) => res.data),

  create: (payload: CreateTaskPayload) =>
    api.post<TogetherTask>("/tasks", payload).then((res) => res.data),

  update: (id: string, payload: UpdateTaskPayload) =>
    api.patch<TogetherTask>(`/tasks/${id}`, payload).then((res) => res.data),

  move: (id: string, columnId: string, order: number) =>
    api
      .patch<TogetherTask>(`/tasks/${id}/move`, {
        columnId,
        order,
      })
      .then((res) => res.data),

  remove: (id: string) => api.delete(`/tasks/${id}`).then((res) => res.data),

  complete: (id: string) => api.post<TogetherTask>(`/tasks/${id}/complete`).then((res) => res.data),

  activate: (id: string) => api.post<TogetherTask>(`/tasks/${id}/activate`).then((res) => res.data),

  nudge: (id: string) => api.post<void>(`/tasks/${id}/nudge`).then((res) => res.data),
};
