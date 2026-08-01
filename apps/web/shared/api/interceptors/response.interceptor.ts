import { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { refresh } from "@/features/auth/api/auth.api";
import { removeAccessToken } from "@/shared/lib/token";
import { routes } from "@/shared/router/paths";

import { api } from "../client/api";

export const responseInterceptor = <T>(response: T) => {
  return response;
};

export const responseErrorInterceptor = async (error: AxiosError) => {
  const originalRequest = error.config as
    (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

  const url = originalRequest?.url ?? "";

  if (
    url.includes("/auth/refresh") ||
    url.includes("/auth/login") ||
    url.includes("/auth/register")
  ) {
    return Promise.reject(error);
  }

  if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  try {
    const { accessToken } = await refresh();

    if (!originalRequest.headers) {
      return Promise.reject(error);
    }

    originalRequest.headers.set("Authorization", `Bearer ${accessToken}`);

    return api(originalRequest);
  } catch {
    removeAccessToken();

    if (typeof window !== "undefined") {
      const redirect = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`${routes.login}?redirect=${encodeURIComponent(redirect)}`);
    }

    return Promise.reject(error);
  }
};
