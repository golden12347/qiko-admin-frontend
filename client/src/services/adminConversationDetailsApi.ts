import APIClient from "./apiClient";

const CONVERSATION_DETAILS_BASE_URL = "http://127.0.0.1:8000";

export interface ConversationDetailsApiResponse {
  message?: string;
  data?: {
    messages?: unknown[];
  };
}

export async function adminConversationDetails(
  conversationId: string | number
): Promise<ConversationDetailsApiResponse> {
  const conversationDetailsClient = new APIClient(
    `/api/v1/admin/conversation-details/${conversationId}`,
    {
      baseURL: CONVERSATION_DETAILS_BASE_URL,
    }
  );
  const { data } = await conversationDetailsClient.get<ConversationDetailsApiResponse>();
  return data;
}

