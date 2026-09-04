import { TogetherTask } from "./task.types";

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
