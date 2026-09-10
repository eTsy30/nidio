import { http } from "@/shared/api/client/api";
import { endCurrentSession, refreshAccessToken } from "@/shared/api/session/session-coordinator";
import { setAccessToken } from "@/shared/lib/token";

import {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "../model";
import { AuthResponse, User } from "../model/auth.types";

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await http.post<AuthResponse>("/auth/login", data);

  setAccessToken(response.accessToken);

  return response;
};

export const refresh = async (): Promise<AuthResponse> => {
  return { accessToken: await refreshAccessToken() };
};

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await http.post<AuthResponse>("/auth/register", data);

  setAccessToken(response.accessToken);

  return response;
};

export const forgotPassword = (data: ForgotPasswordRequest): Promise<void> =>
  http.post<void>("/auth/forgot-password", data);

export const resetPassword = (data: ResetPasswordRequest): Promise<void> =>
  http.post<void>("/auth/reset-password", data);

export const logout = async (): Promise<void> => {
  try {
    await http.post<void>("/auth/logout");
  } catch (error: unknown) {
    const status = (
      error as {
        response?: {
          status?: number;
        };
      }
    )?.response?.status;

    if (status !== 401) {
      throw error;
    }
  } finally {
    endCurrentSession();
  }
};

export const me = async (): Promise<User> => {
  return http.get<User>("/users/me");
};

export const acceptInviteAfterRegistration = (token: string): Promise<void> =>
  http.post<void>(`/relationship/invite/${token}/accept`);
