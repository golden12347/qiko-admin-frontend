import APIClient from "./apiClient";
import { buildDateFilterParams, type ApiDateFilterStateLike } from "./dateFilterParams";

const workerListClient = new APIClient("/api/v1/admin/worker-list", {
  baseURL: "http://127.0.0.1:8000",
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

