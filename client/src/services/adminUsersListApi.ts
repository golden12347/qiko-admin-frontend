import APIClient from "./apiClient";
import { buildDateFilterParams, type ApiDateFilterStateLike } from "./dateFilterParams";
import { BACKEND_BASE_URL } from "./apiConfig";

const adminUsersListClient = new APIClient("/api/v1/admin/admin-user-name", {
  baseURL: BACKEND_BASE_URL,
});

export interface AdminUserNameItem {
  id?: number | string;
  name?: string;
  email?: string;
  status?: boolean;
  invite_status?: string;
  created_at?: string;
}

interface AdminUsersListEnvelope {
  message?: string;
  data?: AdminUserNameItem[];
}

export async function adminUsersList(filter?: ApiDateFilterStateLike): Promise<AdminUserNameItem[]> {
  const { data } = await adminUsersListClient.get<AdminUserNameItem[] | AdminUsersListEnvelope>(
    buildDateFilterParams(filter)
  );
  const envelope = data as AdminUsersListEnvelope;
  if (Array.isArray(envelope?.data)) return envelope.data;
  return Array.isArray(data) ? data : [];
}

