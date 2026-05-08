import APIClient from "./apiClient";

const sendInviteClient = new APIClient("/api/v1/admin/send-invite", {
  baseURL: "http://127.0.0.1:8000",
});

export interface SendInvitePayload {
  name: string;
  email: string;
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

