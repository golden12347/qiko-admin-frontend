import type { AxiosRequestConfig } from "axios";
import { createAxiosInstance } from "./axiosInstance";

/**
 * Thin wrapper around axios for REST endpoints (web).
 * Pattern mirrors a mobile APIClient: one instance per request with shared interceptors.
 */
export default class APIClient {
  constructor(
    private readonly endpoint: string,
    private readonly defaultConfig: AxiosRequestConfig = {}
  ) {}

  private withDefaultConfig(config?: AxiosRequestConfig): AxiosRequestConfig {
    return {
      ...this.defaultConfig,
      ...config,
      headers: {
        ...(this.defaultConfig.headers ?? {}),
        ...(config?.headers ?? {}),
      },
    };
  }

  post<T = unknown>(data?: unknown, config?: AxiosRequestConfig) {
    const requestConfig = this.withDefaultConfig(config);
    const instance = createAxiosInstance(requestConfig);
    return instance.post<T>(this.endpoint, data, requestConfig);
  }

  get<T = unknown>(params: Record<string, unknown> = {}, config?: AxiosRequestConfig) {
    const requestConfig = this.withDefaultConfig(config);
    const instance = createAxiosInstance(requestConfig);
    return instance.get<T>(this.endpoint, { ...requestConfig, params });
  }

  put<T = unknown>(data?: unknown, config?: AxiosRequestConfig) {
    const requestConfig = this.withDefaultConfig(config);
    const instance = createAxiosInstance(requestConfig);
    return instance.put<T>(this.endpoint, data, requestConfig);
  }

  patch<T = unknown>(data?: unknown, config?: AxiosRequestConfig) {
    const requestConfig = this.withDefaultConfig(config);
    const instance = createAxiosInstance(requestConfig);
    return instance.patch<T>(this.endpoint, data, requestConfig);
  }

  delete<T = unknown>(params: Record<string, unknown> = {}, config?: AxiosRequestConfig) {
    const requestConfig = this.withDefaultConfig(config);
    const instance = createAxiosInstance(requestConfig);
    return instance.delete<T>(this.endpoint, { ...requestConfig, params });
  }
}
