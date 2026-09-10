import { z } from "zod";

import type { Gender } from "@/shared/contracts/user";

export const editProfileSchema = z.object({
  firstName: z.string().trim().min(1, "Введите имя").max(50, "Имя не должно превышать 50 символов"),

  gender: z.enum(["MALE", "FEMALE", "UNSPECIFIED"] satisfies [Gender, ...Gender[]]),
});

export type EditProfileFormData = z.infer<typeof editProfileSchema>;
