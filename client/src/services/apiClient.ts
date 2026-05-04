import type { AxiosRequestConfig } from "axios";
import { createAxiosInstance } from "./axiosInstance";

/**
 * Thin wrapper around axios for REST endpoints (web).
 * Pattern mirrors a mobile APIClient: one instance per request with shared interceptors.
 */
export default class APIClient {
  constructor(private readonly endpoint: string) {}

  post<T = unknown>(data?: unknown, config?: AxiosRequestConfig) {
    const instance = createAxiosInstance(config);
    return instance.post<T>(this.endpoint, data, config);
  }

  get<T = unknown>(params: Record<string, unknown> = {}, config?: AxiosRequestConfig) {
    const instance = createAxiosInstance(config);
    return instance.get<T>(this.endpoint, { ...config, params });
  }

  put<T = unknown>(data?: unknown, config?: AxiosRequestConfig) {
    const instance = createAxiosInstance(config);
    return instance.put<T>(this.endpoint, data, config);
  }

  patch<T = unknown>(data?: unknown, config?: AxiosRequestConfig) {
    const instance = createAxiosInstance(config);
    return instance.patch<T>(this.endpoint, data, config);
  }

  delete<T = unknown>(params: Record<string, unknown> = {}, config?: AxiosRequestConfig) {
    const instance = createAxiosInstance(config);
    return instance.delete<T>(this.endpoint, { ...config, params });
  }
}
