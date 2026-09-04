export type TaskRepeat = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
export type AssigneeType = "ME" | "PARTNER" | "BOTH" | "ROTATE";

export interface TaskCompletion {
  userId: string;
}

export interface ColumnInfo {
  id: string;
  title: string;
  color: string | null;
  icon: string | null;
}

export interface TogetherTask {
  id: string;
  title: string;
  description: string | null;
  columnId: string;
  column?: ColumnInfo;
  coupleId: string;
  order: number;
  priority: boolean;
  assigneeId: string | null;
  assigneeMode: AssigneeType;
  rotationFirstAssigneeId: string | null;
  dueAt: string | null;
  repeat: TaskRepeat;
  repeatUntil: string | null;
  repeatConfig: unknown | null;
  recurringGroupId: string | null;
  occurrenceIndex: number;
  completed: boolean;
  completedAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  completions: TaskCompletion[];
}

export interface TodaySummary {
  my: number;
  partner: number;
  both: number;
  completedToday: number;
}

export type TaskFilter = "all" | "me" | "partner" | "together" | "rotate";
