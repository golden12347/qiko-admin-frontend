const STORAGE_KEY = "qiko_admin_login_flow";

export type LoginFlowSetup = {
  type: "setup";
  tempToken: string;
  qr: string;
};

export type LoginFlow2fa = {
  type: "2fa";
  tempToken: string;
};

export type LoginFlowState = LoginFlowSetup | LoginFlow2fa;

export function saveLoginFlow(state: LoginFlowState): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function readLoginFlow(): LoginFlowState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LoginFlowState;
    if (parsed.type === "setup" && parsed.tempToken && parsed.qr) return parsed;
    if (parsed.type === "2fa" && parsed.tempToken) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function clearLoginFlow(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
