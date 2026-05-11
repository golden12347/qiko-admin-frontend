const DEFAULT_API_V1_BASE_URL = "http://127.0.0.1:8000/api/v1";

export const API_V1_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_V1_BASE_URL).replace(
  /\/$/,
  ""
);

export const BACKEND_BASE_URL = API_V1_BASE_URL.replace(/\/api\/v1$/, "");
