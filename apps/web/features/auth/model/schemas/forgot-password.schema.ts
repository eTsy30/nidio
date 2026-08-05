import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Некорректный email"),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
