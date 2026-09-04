import { api } from "@/shared/api/client/api";

import { TogetherTask } from "../model/task.types";

export interface Column {
  id: string;
  title: string;
  icon: string | null;
  color: string | null;
  order: number;
  tasks: TogetherTask[];
}

export interface Board {
  id: string;
  coupleId: string;
  columns: Column[];
}

export interface CreateColumnPayload {
  title: string;
  icon?: string;
}

export const boardApi = {
  getBoard: () => api.get<Board>("/boards").then((res) => res.data),
  createColumn: (payload: CreateColumnPayload) =>
    api.post<Column>("/boards/columns", payload).then((res) => res.data),
  updateColumn: (id: string, payload: Partial<CreateColumnPayload>) =>
    api.patch<Column>(`/boards/columns/${id}`, payload).then((res) => res.data),
  deleteColumn: (id: string) => api.delete(`/boards/columns/${id}`).then((res) => res.data),
  reorderColumns: (columnIds: string[]) =>
    api.patch("/boards/columns/reorder", { columnIds }).then((res) => res.data),
};
