import { http } from "@/shared/api/client/api";
import type { ChangePasswordRequest, ChangePasswordResponse } from "@/shared/contracts/user";

export const changePassword = (data: ChangePasswordRequest): Promise<ChangePasswordResponse> =>
  http.post<ChangePasswordResponse>("/auth/change-password", data);
