import APIClient from "./apiClient";
import { buildDateFilterParams, type ApiDateFilterStateLike } from "./dateFilterParams";
import { BACKEND_BASE_URL } from "./apiConfig";

export interface ConversationDetailsApiResponse {
  message?: string;
  data?: {
    messages?: unknown[];
  };
}

export async function adminConversationDetails(
  conversationId: string | number,
  filter?: ApiDateFilterStateLike
): Promise<ConversationDetailsApiResponse> {
  const conversationDetailsClient = new APIClient(
    `/api/v1/admin/conversation-details/${conversationId}`,
    {
      baseURL: BACKEND_BASE_URL,
    }
  );
  const { data } = await conversationDetailsClient.get<ConversationDetailsApiResponse>(
    buildDateFilterParams(filter)
  );
  return data;
}

