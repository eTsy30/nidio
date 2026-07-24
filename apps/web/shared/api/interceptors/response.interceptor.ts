import { AxiosResponse } from "axios";

export const responseInterceptor = <T>(response: AxiosResponse<T>) => {
  return response.data;
};
