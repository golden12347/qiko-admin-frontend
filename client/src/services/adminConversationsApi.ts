import APIClient from "./apiClient";
import { buildDateFilterParams, type ApiDateFilterStateLike } from "./dateFilterParams";
import { BACKEND_BASE_URL } from "./apiConfig";

const conversationListClient = new APIClient("/api/v1/admin/conversation-list", {
  baseURL: BACKEND_BASE_URL,
});

export interface ConversationListApiResponse {
  data?: unknown[] | Record<string, unknown>;
  items?: unknown[];
  conversations?: unknown[];
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
  meta?: {
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
}

export async function adminConversationList(
  page: number,
  filter?: ApiDateFilterStateLike
): Promise<ConversationListApiResponse> {
  const { data } = await conversationListClient.get<ConversationListApiResponse>({
    page,
    ...buildDateFilterParams(filter),
  });
  return data;
}

