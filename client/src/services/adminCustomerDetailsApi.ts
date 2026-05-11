import APIClient from "./apiClient";
import { buildDateFilterParams, type ApiDateFilterStateLike } from "./dateFilterParams";
import { BACKEND_BASE_URL } from "./apiConfig";

export interface CustomerDetailsApiResponse {
  message?: string;
  data?: {
    user?: {
      id?: number | string;
      user_name?: string;
      email?: string;
      created_at?: string;
    };
    total_agents_count?: number;
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
  };
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
