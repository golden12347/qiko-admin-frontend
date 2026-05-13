import APIClient from "./apiClient";
import { buildDateFilterParams, type ApiDateFilterStateLike } from "./dateFilterParams";
import { BACKEND_BASE_URL } from "./apiConfig";

const customerListClient = new APIClient("/api/v1/admin/customer-list", {
  baseURL: BACKEND_BASE_URL,
});

export interface CustomerListApiResponse {
  data?: unknown[];
  items?: unknown[];
  customers?: unknown[];
  active_stripe_status_count?: number;
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
  meta?: {
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
    active_stripe_status_count?: number;
  };
}

/**
 * Fetch paginated admin customer list.
 * Optional `search` is sent as a query param when non-empty (server-side search).
 */
export async function adminCustomerList(
  page: number,
  filter?: ApiDateFilterStateLike,
  search?: string
): Promise<CustomerListApiResponse> {
  const q = (search ?? "").trim();
  const params: Record<string, unknown> = {
    page,
    ...buildDateFilterParams(filter),
  };
  if (q.length > 0) {
    params.search = q;
  }
  const { data } = await customerListClient.get<CustomerListApiResponse>(params);
  return data;
}

/** DELETE `/api/v1/admin/customer-delete/{userId}` */
export async function adminDeleteCustomer(userId: string): Promise<void> {
  const client = new APIClient(`/api/v1/admin/customer-delete/${encodeURIComponent(userId)}`, {
    baseURL: BACKEND_BASE_URL,
  });
  await client.delete();
}

const customerSendInviteClient = new APIClient("/api/v1/admin/customer/send-invite", {
  baseURL: BACKEND_BASE_URL,
});

export interface CustomerSendInvitePayload {
  user_name: string;
  email: string;
}

export interface CustomerSendInviteResponse {
  message?: string;
}

interface CustomerSendInviteEnvelope {
  message?: string;
  data?: CustomerSendInviteResponse;
}

/** POST `/api/v1/admin/customer/send-invite` */
export async function adminCustomerSendInvite(
  payload: CustomerSendInvitePayload
): Promise<CustomerSendInviteResponse> {
  const { data } = await customerSendInviteClient.post<
    CustomerSendInviteResponse | CustomerSendInviteEnvelope
  >(payload);
  const envelope = data as CustomerSendInviteEnvelope;
  return envelope?.data && typeof envelope.data === "object"
    ? envelope.data
    : (data as CustomerSendInviteResponse);
}

