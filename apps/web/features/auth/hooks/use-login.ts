import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword,
} from "../api/auth.api";
import {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "../model";
import { AuthResponse, User } from "../model/auth.types";

export const useLogin = () => {
  return useMutation<AuthResponse, AxiosError<{ message?: string }>, LoginRequest>({
    mutationFn: login,
  });
};

export const useRefresh = () => {
  return useMutation<AuthResponse, AxiosError, void>({
    mutationFn: refresh,
  });
};

export const useRegister = () => {
  return useMutation<AuthResponse, AxiosError<{ message?: string }>, RegisterRequest>({
    mutationFn: register,
    retry: false,
  });
};

export const useForgotPassword = () => {
  return useMutation<void, AxiosError, ForgotPasswordRequest>({
    mutationFn: forgotPassword,
  });
};

export const useResetPassword = () => {
  return useMutation<void, AxiosError, ResetPasswordRequest>({
    mutationFn: resetPassword,
  });
};

export const useLogout = () => {
  return useMutation<void, AxiosError, void>({
    mutationFn: logout,
  });
};

export const useMe = () => {
  return useQuery<User, AxiosError>({
    queryKey: ["auth", "me"],
    queryFn: me,
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
};
