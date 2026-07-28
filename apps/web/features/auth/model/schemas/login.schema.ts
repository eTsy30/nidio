import { z } from "zod";
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Некорректный email"),
  password: z
    .string()
    .min(6, { message: "Минимум 6 символов" })
    .max(120, { message: "Максимум 120 символов" }),
});
export type LoginRequest = z.infer<typeof loginSchema>;
