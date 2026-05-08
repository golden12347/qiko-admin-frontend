import APIClient from "./apiClient";
import { buildDateFilterParams, type ApiDateFilterStateLike } from "./dateFilterParams";

const customerListClient = new APIClient("/api/v1/admin/customer-list", {
  baseURL: "http://127.0.0.1:8000",
});

export interface CustomerListApiResponse {
  data?: unknown[];
  items?: unknown[];
  customers?: unknown[];
  active_stripe_status_count?: number;
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
  meta?: {
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
    active_stripe_status_count?: number;
  };
}

/**
 * Fetch paginated admin customer list.
 * Uses same APIClient pattern as login/logout endpoints.
 */
export async function adminCustomerList(
  page: number,
  filter?: ApiDateFilterStateLike
): Promise<CustomerListApiResponse> {
  const { data } = await customerListClient.get<CustomerListApiResponse>({
    page,
    ...buildDateFilterParams(filter),
  });
  return data;
}

