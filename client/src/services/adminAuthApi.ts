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
const forgotPasswordClient = new APIClient("/admin/forgot-password");

export interface AdminForgotPasswordResponse {
  message?: string;
}

export async function adminLogin(payload: { email: string; password: string }): Promise<AdminLoginResponse> {
  const { data } = await loginClient.post<AdminLoginResponse>(payload);
  return data;
}

export async function adminLogout(): Promise<unknown> {
  const { data } = await logoutClient.post<unknown>();
  return data;
}

export async function adminForgotPassword(payload: { email: string }): Promise<AdminForgotPasswordResponse> {
  const { data } = await forgotPasswordClient.post<AdminForgotPasswordResponse>(payload);
  return data;
}
