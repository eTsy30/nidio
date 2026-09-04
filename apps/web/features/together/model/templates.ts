import { AssigneeType, TaskRepeat } from "./task.types";

export interface TemplateItem {
  id: string;
  title: string;
  assigneeMode: AssigneeType;
  repeat: TaskRepeat;
  order: number;
}

export interface Template {
  id: string;
  title: string;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  items: TemplateItem[];
}
