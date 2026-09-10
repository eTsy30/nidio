export type Gender = "MALE" | "FEMALE" | "UNSPECIFIED";

export interface AuthResponse {
  accessToken: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  avatarUrl: string | null;
  gender: Gender;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}
