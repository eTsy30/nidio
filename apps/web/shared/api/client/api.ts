import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { getAccessToken } from "@/shared/lib/token";

import { apiConfig } from "../config/api.config";
import {
  responseErrorInterceptor,
  responseInterceptor,
} from "../interceptors/response.interceptor";

export const api = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

export const http = {
  get: <T>(url: string, config?: Parameters<typeof api.get>[1]) =>
    api.get<T>(url, config).then((response: AxiosResponse<T>) => response.data),

  post: <T>(url: string, data?: unknown, config?: Parameters<typeof api.post>[2]) =>
    api.post<T>(url, data, config).then((response: AxiosResponse<T>) => response.data),

  put: <T>(url: string, data?: unknown, config?: Parameters<typeof api.put>[2]) =>
    api.put<T>(url, data, config).then((response: AxiosResponse<T>) => response.data),

  patch: <T>(url: string, data?: unknown, config?: Parameters<typeof api.patch>[2]) =>
    api.patch<T>(url, data, config).then((response: AxiosResponse<T>) => response.data),

  delete: <T>(url: string, config?: Parameters<typeof api.delete>[1]) =>
    api.delete<T>(url, config).then((response: AxiosResponse<T>) => response.data),
};

export type ApiError = AxiosError<{ message?: string; code?: string }>;
