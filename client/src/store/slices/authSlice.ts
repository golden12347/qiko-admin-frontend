import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role_name?: string;
}

export interface AuthState {
  token: string | null;
  admin: AdminUser | null;
}

const AUTH_STORAGE_KEY = "qiko_admin_auth";

function readPersistedAuth(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { token: null, admin: null };
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    return {
      token: typeof parsed.token === "string" ? parsed.token : null,
      admin:
        parsed.admin &&
        typeof parsed.admin.id === "number" &&
        typeof parsed.admin.name === "string" &&
        typeof parsed.admin.email === "string"
          ? {
              ...parsed.admin,
              role_name:
                typeof parsed.admin.role_name === "string" ? parsed.admin.role_name : undefined,
            }
          : null,
    };
  } catch {
    return { token: null, admin: null };
  }
}

function persistAuth(state: AuthState) {
  if (state.token && state.admin) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: state.token, admin: state.admin }));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

const initialState: AuthState = readPersistedAuth();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; admin: AdminUser }>) {
      state.token = action.payload.token;
      state.admin = action.payload.admin;
      persistAuth(state);
    },
    clearAuth(state) {
      state.token = null;
      state.admin = null;
      persistAuth(state);
    },
  },
});

export const { setCredentials, clearAuth } = authSlice.actions;
export default authSlice.reducer;
