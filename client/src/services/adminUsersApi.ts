import APIClient from "./apiClient";
import { BACKEND_BASE_URL } from "./apiConfig";

const sendInviteClient = new APIClient("/api/v1/admin/send-invite", {
  baseURL: BACKEND_BASE_URL,
});

/** Values sent to POST `/api/v1/admin/send-invite` */
export type AdminInviteRole = "super_admin" | "viewer";

export const ADMIN_INVITE_ROLE_OPTIONS: ReadonlyArray<{ label: string; value: AdminInviteRole }> = [
  { label: "Super Admin", value: "super_admin" },
  { label: "Viewer", value: "viewer" },
];

export interface SendInvitePayload {
  name: string;
  email: string;
  role: AdminInviteRole;
}

export interface SendInviteResponse {
  message?: string;
}

interface SendInviteEnvelope {
  message?: string;
  data?: SendInviteResponse;
}

export async function adminSendInvite(payload: SendInvitePayload): Promise<SendInviteResponse> {
  const { data } = await sendInviteClient.post<SendInviteResponse | SendInviteEnvelope>(payload);
  const envelope = data as SendInviteEnvelope;
  return envelope?.data && typeof envelope.data === "object"
    ? envelope.data
    : (data as SendInviteResponse);
}

