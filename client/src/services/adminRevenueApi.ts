import APIClient from "./apiClient";
import { buildDateFilterParams, type ApiDateFilterStateLike } from "./dateFilterParams";
import { BACKEND_BASE_URL } from "./apiConfig";

const revenueClient = new APIClient("/api/v1/admin/revenue", {
  baseURL: BACKEND_BASE_URL,
});

export interface RevenueApiResponse {
  total_earning?: number | string;
  total_earning_percentage?: number | string;
  average_revenue_per_user?: number | string;
  average_revenue_per_user_percentage?: number | string;
  average_revenue_per_agent?: number | string;
  average_revenue_per_agent_percentage?: number | string;
  top_customers_earnings?: Array<{
    user_name?: string;
    total_earnings?: number | string;
  }>;
  plan_distribution?: {
    basic?: number | string;
    premium?: number | string;
    enterprise?: number | string;
    basic_total_amount?: number | string;
    premium_total_amount?: number | string;
    enterprise_total_amount?: number | string;
  };
  revenue_over_time?: Array<{
    month?: string;
    earning?: number | string;
  }>;
  /** Table rows, or a Laravel-style paginator `{ data: rows, total, last_page, ... }`. */
  customer_revenue_table?:
    | Array<{
        user_name?: string;
        plan_name?: string;
        total_earnings?: number | string;
        plan_created_at?: string;
      }>
    | {
        data?: unknown[];
        total?: number | string;
        current_page?: number | string;
        last_page?: number | string;
        per_page?: number | string;
      };
  customer_revenue_table_meta?: {
    total?: number | string;
    current_page?: number | string;
    last_page?: number | string;
    per_page?: number | string;
  };
}

interface RevenueApiEnvelope {
  message?: string;
  data?: RevenueApiResponse;
}

export async function adminRevenue(
  filter?: ApiDateFilterStateLike,
  options?: { customerRevenuePage?: number }
): Promise<RevenueApiResponse> {
  const params: Record<string, unknown> = {
    ...buildDateFilterParams(filter),
  };
  if (options?.customerRevenuePage != null && options.customerRevenuePage > 0) {
    params.page = options.customerRevenuePage;
  }
  const { data } = await revenueClient.get<RevenueApiResponse | RevenueApiEnvelope>(params);
  const envelope = data as RevenueApiEnvelope;
  return envelope?.data && typeof envelope.data === "object"
    ? envelope.data
    : (data as RevenueApiResponse);
}

