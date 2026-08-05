import { AxiosError, AxiosResponse } from "axios";

import { refresh } from "@/features/auth/api/auth.api";
import { removeAccessToken } from "@/shared/lib/token";
import { routes } from "@/shared/router/paths";

import { api } from "../client/api";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

export const responseInterceptor = <T, D>(response: AxiosResponse<T, D>) => {
  return response;
};

export const responseErrorInterceptor = async (error: AxiosError) => {
  const originalRequest = error.config;

  if (!originalRequest) {
    return Promise.reject(error);
  }

  const url = originalRequest.url ?? "";

  if (
    url.includes("/auth/refresh") ||
    url.includes("/auth/login") ||
    url.includes("/auth/register")
  ) {
    return Promise.reject(error);
  }

  if (error.response?.status !== 401 || originalRequest._retry) {
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  try {
    const { accessToken } = await refresh();

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
