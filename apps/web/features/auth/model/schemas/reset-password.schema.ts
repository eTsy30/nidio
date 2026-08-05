import { z } from "zod";

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Токен обязателен"),
  newPassword: z
    .string()
    .min(6, { message: "Минимум 6 символов" })
    .max(120, { message: "Максимум 120 символов" }),
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
