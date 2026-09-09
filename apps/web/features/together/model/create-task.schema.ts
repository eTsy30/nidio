import { z } from "zod";

export const assigneeValues = ["ME", "PARTNER", "BOTH", "ROTATE"] as const;
export const repeatValues = ["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Введите название задачи").max(255),
  assignee: z.enum(assigneeValues),
  repeat: z.enum(repeatValues),
  hasDueDate: z.boolean(),
  columnId: z.string().min(1, "Выберите колонку"),
  priority: z.boolean(), // ← без .default()
  rotationFirst: z.string().optional(),
});

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
