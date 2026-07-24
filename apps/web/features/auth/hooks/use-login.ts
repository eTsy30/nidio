import { useMutation } from "@tanstack/react-query";

import { forgotPassword, login, register, resetPassword } from "../api/auth.api";
export const useLogin = () => {
  return useMutation({
    mutationFn: login,
  });
};
export const useRegister = () => {
  return useMutation({
    mutationFn: register,
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
