import APIClient from "./apiClient";

const acceptInviteClient = new APIClient("/api/v1/admin/accept-invite", {
  baseURL: "http://127.0.0.1:8000",
});

export interface AcceptInvitePayload {
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AcceptInviteResponse {
  message?: string;
}

interface AcceptInviteEnvelope {
  message?: string;
  data?: AcceptInviteResponse;
}

export async function adminAcceptInvite(payload: AcceptInvitePayload): Promise<AcceptInviteResponse> {
  const { data } = await acceptInviteClient.post<AcceptInviteResponse | AcceptInviteEnvelope>(payload);
  const envelope = data as AcceptInviteEnvelope;
  return envelope?.data && typeof envelope.data === "object"
    ? envelope.data
    : (data as AcceptInviteResponse);
}

