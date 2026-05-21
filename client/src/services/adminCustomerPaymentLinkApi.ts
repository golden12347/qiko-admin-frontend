import APIClient from "./apiClient";
import { BACKEND_BASE_URL } from "./apiConfig";

export type CustomerPaymentLinkType = "one_time" | "subscription";

export type CustomerPaymentLinkDuration = "daily" | "weekly" | "monthly" | "yearly";

export interface CustomerPaymentLinkOneTimePayload {
  amount: number;
  payment_type: "one_time";
  description: string;
  label: string;
}

export interface CustomerPaymentLinkSubscriptionPayload {
  amount: number;
  payment_type: "subscription";
  duration: CustomerPaymentLinkDuration;
  description: string;
  label: string;
}

export type CustomerPaymentLinkPayload =
  | CustomerPaymentLinkOneTimePayload
  | CustomerPaymentLinkSubscriptionPayload;

/** POST `/api/v1/admin/customer-payment-link/{userId}` — returns full response body */
export async function adminCustomerPaymentLink(
  userId: string,
  payload: CustomerPaymentLinkPayload
): Promise<unknown> {
  const client = new APIClient(
    `/api/v1/admin/customer-payment-link/${encodeURIComponent(userId)}`,
    { baseURL: BACKEND_BASE_URL }
  );
  const { data } = await client.post<unknown>(payload);
  return data;
}
