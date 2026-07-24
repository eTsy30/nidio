import { api } from "@/shared/api/client/api";

import {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "../model";
import { AuthResponse } from "../types/auth.types";

export const login = (data: LoginRequest) => api.post<AuthResponse>("/auth/login", data);

export const register = (data: RegisterRequest) => api.post<AuthResponse>("/auth/register", data);

export const forgotPassword = (data: ForgotPasswordRequest) =>
  api.post<void>("/auth/forgot-password", data);

export const resetPassword = (data: ResetPasswordRequest) =>
  api.post<void>("/auth/reset-password", data);
