import type { Gender, User } from "@/features/auth/model/auth.types";
import { http } from "@/shared/api/client/api";

export interface UpdateProfileRequest {
  firstName: string;
  avatarUrl: string | null;
  gender: Gender;
}

export interface UploadResult {
  key: string;
  url: string;
}

export const updateProfile = (data: UpdateProfileRequest): Promise<User> => {
  return http.patch<User>("/users/me", data);
};

export const uploadProfileImage = (file: File): Promise<UploadResult> => {
  const formData = new FormData();

  formData.append("file", file);

  return http.post<UploadResult>("/storage/images", formData);
};
