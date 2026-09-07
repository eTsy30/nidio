import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),

    newPassword: z.string().min(8, "Новый пароль должен содержать минимум 8 символов"),

    confirmPassword: z.string().min(1, "Повторите новый пароль"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли не совпадают",
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
