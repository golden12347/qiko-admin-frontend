import APIClient from "./apiClient";
import { buildDateFilterParams, type ApiDateFilterStateLike } from "./dateFilterParams";
import { BACKEND_BASE_URL } from "./apiConfig";

const overviewClient = new APIClient("/api/v1/admin/overview", {
  baseURL: BACKEND_BASE_URL,
});

export interface OverviewApiResponse {
  total_users?: number;
  total_users_percentage?: number | string;
  total_agents?: number;
  total_agents_percentage?: number | string;
  total_conversations?: number;
  total_conversations_percentage?: number | string;
  total_subscriptions?: number;
  total_subscriptions_percentage?: number | string;
  total_earning?: number;
  total_earning_percentage?: number | string;
  customer_conversations_users?: Array<{
    user_name?: string;
    total_conversations?: number;
    subscription_plan_name?: string | null;
  }>;
  revenue_over_time?: Array<{
    month?: string;
    earning?: number | string;
  }>;
  top_customers_earnings?: Array<{
    user_name?: string;
    agents_count?: number | string;
    subscription_plan_name?: string | null;
    total_earnings?: number | string;
  }>;
  conversations_over_time?: Array<{
    month: string;
    conversations: number;
  }>;
  customer_growth_trend?: Array<{
    month?: string;
    new_customers?: number | string;
    churned_customers?: number | string;
    newCustomers?: number | string;
    churnedCustomers?: number | string;
  }>;
}

interface OverviewApiEnvelope {
  message?: string;
  data?: OverviewApiResponse;
}

export async function adminOverview(filter?: ApiDateFilterStateLike): Promise<OverviewApiResponse> {
  const { data } = await overviewClient.get<OverviewApiResponse | OverviewApiEnvelope>(
    buildDateFilterParams(filter)
  );
  const envelope = data as OverviewApiEnvelope;
  return envelope?.data && typeof envelope.data === "object"
    ? envelope.data
    : (data as OverviewApiResponse);
}

