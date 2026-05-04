import APIClient from "./apiClient";

export interface AdminLoginResponse {
  message: string;
  token: string;
  token_type: string;
  expires_in: number;
  admin: {
    id: number;
    name: string;
    email: string;
  };
}

const loginClient = new APIClient("/admin/login");
const logoutClient = new APIClient("/admin/logout");

export async function adminLogin(payload: { email: string; password: string }): Promise<AdminLoginResponse> {
  const { data } = await loginClient.post<AdminLoginResponse>(payload);
  return data;
}

export async function adminLogout(): Promise<unknown> {
  const { data } = await logoutClient.post<unknown>();
  return data;
}
