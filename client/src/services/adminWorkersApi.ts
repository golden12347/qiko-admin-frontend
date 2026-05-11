import APIClient from "./apiClient";
import { buildDateFilterParams, type ApiDateFilterStateLike } from "./dateFilterParams";
import { BACKEND_BASE_URL } from "./apiConfig";

const workerListClient = new APIClient("/api/v1/admin/worker-list", {
  baseURL: BACKEND_BASE_URL,
});

export interface WorkerListApiResponse {
  data?: unknown[] | Record<string, unknown>;
  items?: unknown[];
  workers?: unknown[];
  total_live?: number;
  total_training?: number;
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
  meta?: {
    total_live?: number;
    total_training?: number;
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
}

export async function adminWorkerList(
  page: number,
  filter?: ApiDateFilterStateLike
): Promise<WorkerListApiResponse> {
  const { data } = await workerListClient.get<WorkerListApiResponse>({
    page,
    ...buildDateFilterParams(filter),
  });
  return data;
}

