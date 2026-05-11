import APIClient from "./apiClient";
import { BACKEND_BASE_URL } from "./apiConfig";

export interface CustomerIsStudioPayload {
  is_studio: boolean;
}

export interface CustomerIsStudioResponse {
  message?: string;
  data?: unknown;
}

export async function adminCustomerIsStudio(
  userId: string | number,
  payload: CustomerIsStudioPayload
): Promise<CustomerIsStudioResponse> {
  const client = new APIClient(`/api/v1/admin/customer-is-studio/${userId}`, {
    baseURL: BACKEND_BASE_URL,
  });
  const { data } = await client.post<CustomerIsStudioResponse>(payload);
  return data;
}
