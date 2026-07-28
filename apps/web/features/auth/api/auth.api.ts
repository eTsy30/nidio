import { http } from "@/shared/api/client/api";
import { removeAccessToken, setAccessToken } from "@/shared/lib/token";

import {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "../model";
import { AuthResponse } from "../model/auth.types";

export const login = async (data: LoginRequest) => {
  const response = await http.post<AuthResponse>("/auth/login", data);
  setAccessToken(response.accessToken);
  return response;
};

export const refresh = async () => {
  const response = await http.post<AuthResponse>("/auth/refresh");
  setAccessToken(response.accessToken);
  return response;
};

export const register = async (data: RegisterRequest) => {
  const response = await http.post<AuthResponse>("/auth/register", data);
  setAccessToken(response.accessToken);
  return response;
};

export const forgotPassword = (data: ForgotPasswordRequest) =>
  http.post<void>("/auth/forgot-password", data);

export const resetPassword = (data: ResetPasswordRequest) =>
  http.post<void>("/auth/reset-password", data);

export const logout = async () => {
  try {
    await http.post<void>("/auth/logout");
  } finally {
    removeAccessToken();
  }
};
