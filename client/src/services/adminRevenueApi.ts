import APIClient from "./apiClient";
import { buildDateFilterParams, type ApiDateFilterStateLike } from "./dateFilterParams";

const revenueClient = new APIClient("/api/v1/admin/revenue", {
  baseURL: "http://127.0.0.1:8000",
});

export interface RevenueApiResponse {
  total_earning?: number | string;
  average_revenue_per_user?: number | string;
  average_revenue_per_agent?: number | string;
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
  customer_revenue_table?: Array<{
    user_name?: string;
    plan_name?: string;
    total_earnings?: number | string;
    plan_created_at?: string;
  }>;
}

interface RevenueApiEnvelope {
  message?: string;
  data?: RevenueApiResponse;
}

export async function adminRevenue(filter?: ApiDateFilterStateLike): Promise<RevenueApiResponse> {
  const { data } = await revenueClient.get<RevenueApiResponse | RevenueApiEnvelope>(
    buildDateFilterParams(filter)
  );
  const envelope = data as RevenueApiEnvelope;
  return envelope?.data && typeof envelope.data === "object"
    ? envelope.data
    : (data as RevenueApiResponse);
}

