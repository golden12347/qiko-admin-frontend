import APIClient from "./apiClient";

const conversationListClient = new APIClient("/api/v1/admin/conversation-list", {
  baseURL: "http://127.0.0.1:8000",
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

export async function adminConversationList(page: number): Promise<ConversationListApiResponse> {
  const { data } = await conversationListClient.get<ConversationListApiResponse>({ page });
  return data;
}

