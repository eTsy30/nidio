import { z } from "zod";
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "Минимум 2 символа" })
      .max(50, { message: "Максимум 50 символов" }),
    email: z.string().email("Некорректный email"),
    password: z
      .string()
      .min(6, { message: "Минимум 6 символов" })
      .max(120, { message: "Максимум 120 символов" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Минимум 6 символов" })
      .max(120, { message: "Максимум 120 символов" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type RegisterRequest = z.infer<typeof registerSchema>;
