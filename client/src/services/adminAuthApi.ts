import APIClient from "./apiClient";
import { toQrImageSrc } from "@/lib/qrImageSrc";

export interface AdminAuthAdmin {
  id: number;
  name: string;
  email: string;
  role_name?: string;
}

export interface AdminLoginCompleteResponse {
  message?: string;
  token: string;
  token_type?: string;
  expires_in?: number;
  admin: AdminAuthAdmin;
}

export interface AdminLoginSetupPendingResponse {
  message?: string;
  requires_setup: boolean;
  temp_token: string;
  temp_token_expires_at?: string;
  qr_code: string;
}

export interface AdminLogin2faPendingResponse {
  message?: string;
  requires_2fa: boolean;
  temp_token: string;
  temp_token_expires_at?: string;
}

export type AdminLoginApiResponse =
  | AdminLoginCompleteResponse
  | AdminLoginSetupPendingResponse
  | AdminLogin2faPendingResponse;

export type ParsedLoginStep =
  | { step: "setup"; tempToken: string; qr: string; message?: string }
  | { step: "2fa"; tempToken: string; message?: string }
  | { step: "complete"; data: AdminLoginCompleteResponse };

export interface VerifyTwoFactorPayload {
  temp_token: string;
  code: string;
}

const loginClient = new APIClient("/admin/login");
const verifySetupClient = new APIClient("/admin/2fa/verify-setup");
const verifyLoginClient = new APIClient("/admin/2fa/verify-login");
const logoutClient = new APIClient("/admin/logout");
const forgotPasswordClient = new APIClient("/admin/forgot-password");

export interface AdminForgotPasswordResponse {
  message?: string;
}

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function unwrapResponseRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  let current: unknown = raw;
  for (let depth = 0; depth < 6; depth += 1) {
    const record = readRecord(current);
    if (!record) break;
    const nested = record.data;
    if (nested && typeof nested === "object") {
      current = nested;
      continue;
    }
    return record;
  }
  return {};
}

function normalizeCompleteResponse(raw: unknown): AdminLoginCompleteResponse {
  return unwrapResponseRecord(raw) as unknown as AdminLoginCompleteResponse;
}

export function parseAdminLoginResponse(raw: unknown): ParsedLoginStep | null {
  const d = unwrapResponseRecord(raw);

  if (isTruthyFlag(d.requires_setup)) {
    const tempToken =
      typeof d.temp_token === "string"
        ? d.temp_token
        : typeof d.tempToken === "string"
          ? d.tempToken
          : "";
    const rawQr =
      typeof d.qr_code === "string" ? d.qr_code : typeof d.qr === "string" ? d.qr : "";
    const qr = toQrImageSrc(rawQr);
    if (tempToken && qr) {
      return {
        step: "setup",
        tempToken,
        qr,
        message: typeof d.message === "string" ? d.message : undefined,
      };
    }
  }

  if (isTruthyFlag(d.requires_2fa)) {
    const tempToken =
      typeof d.temp_token === "string"
        ? d.temp_token
        : typeof d.tempToken === "string"
          ? d.tempToken
          : "";
    if (tempToken) {
      return {
        step: "2fa",
        tempToken,
        message: typeof d.message === "string" ? d.message : undefined,
      };
    }
  }

  const token = typeof d.token === "string" ? d.token : "";
  const admin = d.admin as AdminAuthAdmin | undefined;
  if (token && admin?.id) {
    return {
      step: "complete",
      data: d as unknown as AdminLoginCompleteResponse,
    };
  }

  return null;
}

export function isCompleteLoginResponse(data: AdminLoginCompleteResponse): boolean {
  return typeof data.token === "string" && data.token.length > 0 && Boolean(data.admin?.id);
}

export async function adminLogin(payload: { email: string; password: string }): Promise<unknown> {
  const { data } = await loginClient.post<unknown>(payload);
  return data;
}

export async function adminVerifyTwoFactorSetup(
  payload: VerifyTwoFactorPayload
): Promise<AdminLoginCompleteResponse> {
  const { data } = await verifySetupClient.post<AdminLoginCompleteResponse>(payload);
  return normalizeCompleteResponse(data);
}

export async function adminVerifyTwoFactorLogin(
  payload: VerifyTwoFactorPayload
): Promise<AdminLoginCompleteResponse> {
  const { data } = await verifyLoginClient.post<AdminLoginCompleteResponse>(payload);
  return normalizeCompleteResponse(data);
}

export async function adminLogout(): Promise<unknown> {
  const { data } = await logoutClient.post<unknown>();
  return data;
}

export async function adminForgotPassword(payload: { email: string }): Promise<AdminForgotPasswordResponse> {
  const { data } = await forgotPasswordClient.post<AdminForgotPasswordResponse>(payload);
  return data;
}
