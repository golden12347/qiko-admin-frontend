import APIClient from "./apiClient";
import { buildDateFilterParams, type ApiDateFilterStateLike } from "./dateFilterParams";
import { BACKEND_BASE_URL } from "./apiConfig";

export interface CustomerDetailsUser {
  id?: number | string;
  user_name?: string;
  email?: string;
  created_at?: string;
  stripe_status?: string;
  subscription_plan_name?: string | null;
  is_studio?: boolean | number | string;
  subscription_amount?: number | string | null;
  subscription_amount_monthly?: number | string | null;
  monthly_subscription?: number | string | null;
  subscription_date?: string;
  next_payment_date?: string;
  next_billing_date?: string;
}

export interface CustomerTeamMemberApi {
  id?: number | string;
  name?: string;
  user_name?: string;
  email?: string;
  user_email?: string;
  role?: string;
  role_name?: string;
  status?: string;
  date?: string;
  joined_date?: string;
  joined_at?: string;
  created_at?: string;
}

export interface CustomerDetailsData {
  user?: CustomerDetailsUser | CustomerDetailsUser[];
  subscription_amount?: number | string | null;
  subscription_amount_monthly?: number | string | null;
  monthly_subscription?: number | string | null;
  subscription_date?: string;
  next_payment_date?: string;
  next_billing_date?: string;
  total_agents_count?: number;
  team_members?: CustomerTeamMemberApi[];
  team?: CustomerTeamMemberApi[];
  members?: CustomerTeamMemberApi[];
  agents?: Array<{
    id?: number | string;
    name?: string;
    industry?: string;
    status?: string;
    conversations_count?: number;
  }>;
  recent_conversations?: Array<{
    conversation_id?: number | string;
    agent_name?: string;
    user_name?: string;
    conversation_time?: string;
  }>;
}

export interface CustomerDetailsApiResponse {
  message?: string;
  data?: CustomerDetailsData;
}

export async function adminCustomerDetails(
  userId: string | number,
  filter?: ApiDateFilterStateLike
): Promise<CustomerDetailsApiResponse> {
  const customerDetailsClient = new APIClient(`/api/v1/admin/customer-details/${userId}`, {
    baseURL: BACKEND_BASE_URL,
  });
  const { data } = await customerDetailsClient.get<CustomerDetailsApiResponse>(
    buildDateFilterParams(filter)
  );
  return data;
}
