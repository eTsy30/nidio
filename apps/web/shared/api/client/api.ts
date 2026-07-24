import axios from "axios";

import { apiConfig } from "../config/api.config";
import { responseInterceptor } from "../interceptors/response.interceptor";

export const api = axios.create({
  baseURL: apiConfig.baseURL,

  timeout: apiConfig.timeout,

  headers: {
    "Content-Type": "application/json",
  },
});
api.interceptors.response.use(responseInterceptor);
