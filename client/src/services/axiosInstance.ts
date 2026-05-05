import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { store } from "@/store";
import { clearAuth } from "@/store/slices/authSlice";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000/api/v1";

/**
 * Axios instance for API v1. Attaches Bearer token from Redux when present.
 * On 401, clears auth and surfaces the server message when available.
 */
export function createAxiosInstance(extraConfig: AxiosRequestConfig = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    ...extraConfig,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(extraConfig.headers ?? {}),
    },
  });

  instance.interceptors.request.use(
    (config) => {
      const token = store.getState().auth.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        const msg = error?.response?.data?.message;
        if (typeof msg === "string" && msg.length > 0) {
          toast.error(msg);
        }
        store.dispatch(clearAuth());
      }
      return Promise.reject(error);
    }
  );

  return instance;
}
