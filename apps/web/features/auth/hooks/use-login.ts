import { useMutation } from "@tanstack/react-query";

import { forgotPassword, login, logout, refresh, register, resetPassword } from "../api/auth.api";
export const useLogin = () => {
  return useMutation({
    mutationFn: login,
  });
};
export const useRefresh = () => {
  return useMutation({
    mutationFn: refresh,
  });
};
export const useRegister = () => {
  return useMutation({
    mutationFn: register,
    retry: false,
  });
};
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: forgotPassword,
  });
};
export const useResetPassword = () => {
  return useMutation({
    mutationFn: resetPassword,
  });
};

export const useLogout = () => {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await logout();
    },
  });
};
