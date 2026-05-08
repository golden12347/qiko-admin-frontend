import APIClient from "./apiClient";

const overviewClient = new APIClient("/api/v1/admin/overview", {
  baseURL: "http://127.0.0.1:8000",
});

export interface OverviewApiResponse {
  total_users?: number;
  total_agents?: number;
  total_conversations?: number;
  total_subscriptions?: number;
  total_earning?: number;
  customer_conversations_users?: Array<{
    user_name?: string;
    total_conversations?: number;
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
}

interface OverviewApiEnvelope {
  message?: string;
  data?: OverviewApiResponse;
}

export async function adminOverview(): Promise<OverviewApiResponse> {
  const { data } = await overviewClient.get<OverviewApiResponse | OverviewApiEnvelope>();
  const envelope = data as OverviewApiEnvelope;
  return envelope?.data && typeof envelope.data === "object"
    ? envelope.data
    : (data as OverviewApiResponse);
}

