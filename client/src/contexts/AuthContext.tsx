import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminForgotPassword, adminLogin, adminLogout } from "@/services/adminAuthApi";
import { adminSendInvite, type AdminInviteRole } from "@/services/adminUsersApi";
import { isSuperAdminRole } from "@/lib/authRoles";
import { setCredentials, clearAuth, type AdminUser } from "@/store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type UserRole = "owner" | "admin" | "analyst";
type InviteStatus = "pending" | "accepted" | "revoked";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt?: string;
}

interface StoredUser extends AuthUser {
  password: string;
}

export interface AdminInvite {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: InviteStatus;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

interface InvitePayload {
  name: string;
  email: string;
  role: AdminInviteRole;
}

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  users: AuthUser[];
  invites: AdminInvite[];
  token: string | null;
  admin: AdminUser | null;
  login: (payload: LoginPayload) => Promise<{ ok: boolean; message?: string }>;
  signup: (payload: SignupPayload) => Promise<{ ok: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
  sendInvite: (payload: InvitePayload) => Promise<{ ok: boolean; message: string }>;
  resendInvite: (inviteId: string) => Promise<{ ok: boolean; message: string }>;
  revokeInvite: (inviteId: string) => Promise<{ ok: boolean; message: string }>;
}

const STORAGE_KEYS = {
  users: "qiko_admin_users",
  invites: "qiko_admin_invites",
} as const;

const DEFAULT_ADMIN: StoredUser = {
  id: "usr-owner-001",
  name: "Qiko Owner",
  email: "admin@qiko.ai",
  password: "admin123",
  role: "owner",
  createdAt: "2026-04-01T00:00:00.000Z",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function loadStoredUsers(): StoredUser[] {
  const raw = localStorage.getItem(STORAGE_KEYS.users);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([DEFAULT_ADMIN]));
    return [DEFAULT_ADMIN];
  }
  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([DEFAULT_ADMIN]));
      return [DEFAULT_ADMIN];
    }
    return parsed;
  } catch {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([DEFAULT_ADMIN]));
    return [DEFAULT_ADMIN];
  }
}

function loadStoredInvites(): AdminInvite[] {
  const raw = localStorage.getItem(STORAGE_KEYS.invites);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as AdminInvite[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stripPassword(user: StoredUser): AuthUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function adminToAuthUser(admin: AdminUser): AuthUser {
  return {
    id: String(admin.id),
    name: admin.name,
    email: admin.email,
    role: "admin",
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { token, admin } = useAppSelector((s) => s.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);

  useEffect(() => {
    const users = loadStoredUsers();
    const savedInvites = loadStoredInvites();
    setStoredUsers(users);
    setInvites(savedInvites);
    setIsLoading(false);
  }, []);

  const users = useMemo(() => storedUsers.map(stripPassword), [storedUsers]);

  const currentUser = useMemo(() => (admin ? adminToAuthUser(admin) : null), [admin]);

  const isAuthenticated = Boolean(token && admin);

  const persistUsers = (next: StoredUser[]) => {
    setStoredUsers(next);
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(next));
  };

  const persistInvites = (next: AdminInvite[]) => {
    setInvites(next);
    localStorage.setItem(STORAGE_KEYS.invites, JSON.stringify(next));
  };

  const login = useCallback<AuthContextType["login"]>(
    async ({ email, password }) => {
      try {
        const data = await adminLogin({ email: email.trim(), password });
        dispatch(
          setCredentials({
            token: data.token,
            admin: {
              id: data.admin.id,
              name: data.admin.name,
              email: data.admin.email,
              role_name: data.admin.role_name,
            },
          })
        );
        return { ok: true };
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } } };
        const message = ax?.response?.data?.message;
        return {
          ok: false,
          message: typeof message === "string" ? message : "Invalid email or password.",
        };
      }
    },
    [dispatch]
  );

  const signup = useCallback<AuthContextType["signup"]>(
    async ({ name, email, password }) => {
    const normalizedEmail = normalizeEmail(email);
    const exists = storedUsers.some((u) => normalizeEmail(u.email) === normalizedEmail);
    if (exists) {
      return { ok: false, message: "An account with this email already exists." };
    }

    const pendingInvite = invites.find(
      (invite) => normalizeEmail(invite.email) === normalizedEmail && invite.status === "pending"
    );

    const newUser: StoredUser = {
      id: makeId("usr"),
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: pendingInvite?.role ?? "admin",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const nextUsers = [...storedUsers, newUser];
    persistUsers(nextUsers);

    if (pendingInvite) {
      const nextInvites = invites.map((invite) =>
        invite.id === pendingInvite.id ? { ...invite, status: "accepted" as const } : invite
      );
      persistInvites(nextInvites);
    }

      return { ok: true };
    },
    [storedUsers, invites]
  );

  const forgotPassword = useCallback<AuthContextType["forgotPassword"]>(
    async (email) => {
    const normalizedEmail = normalizeEmail(email);
    try {
      const response = await adminForgotPassword({ email: normalizedEmail });
      return {
        ok: true,
        message: response?.message || "Password reset link sent.",
      };
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const message = ax?.response?.data?.message;
      return {
        ok: false,
        message: typeof message === "string" ? message : "Failed to send reset link.",
      };
    }
    },
    []
  );

  const logout = useCallback<AuthContextType["logout"]>(async () => {
    if (token) {
      try {
        await adminLogout();
      } catch {
        /* still clear client session */
      }
    }
    dispatch(clearAuth());
  }, [dispatch, token]);

  const sendInvite = useCallback<AuthContextType["sendInvite"]>(
    async ({ name, email, role }) => {
    if (!currentUser) {
      return { ok: false, message: "You must be logged in to invite users." };
    }
    if (!isSuperAdminRole(admin?.role_name)) {
      return { ok: false, message: "Only Super Admin can invite panel users." };
    }
    const normalizedEmail = normalizeEmail(email);

    try {
      const invitePayload = {
        name: name.trim(),
        email: email.trim(),
        role,
      };
      await adminSendInvite(invitePayload);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const message = ax?.response?.data?.message;
      return {
        ok: false,
        message: typeof message === "string" ? message : "Failed to send invite.",
      };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const newInvite: AdminInvite = {
      id: makeId("inv"),
      name: name.trim(),
      email: normalizedEmail,
      role: "admin",
      status: "pending",
      invitedBy: currentUser.email,
      invitedAt: now.toISOString(),
      expiresAt,
    };
      persistInvites([newInvite, ...invites]);
      return { ok: true, message: "Invite sent successfully." };
    },
    [admin?.role_name, currentUser, invites]
  );

  const resendInvite = useCallback<AuthContextType["resendInvite"]>(
    async (inviteId) => {
    const invite = invites.find((i) => i.id === inviteId);
    if (!invite || invite.status !== "pending") {
      return { ok: false, message: "Only pending invites can be resent." };
    }
    const now = new Date();
    const nextInvites = invites.map((i) =>
      i.id === inviteId
        ? {
            ...i,
            invitedAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          }
        : i
    );
      persistInvites(nextInvites);
      return { ok: true, message: "Invite resent." };
    },
    [invites]
  );

  const revokeInvite = useCallback<AuthContextType["revokeInvite"]>(
    async (inviteId) => {
    const invite = invites.find((i) => i.id === inviteId);
    if (!invite || invite.status !== "pending") {
      return { ok: false, message: "Only pending invites can be revoked." };
    }
    const nextInvites = invites.map((i) => (i.id === inviteId ? { ...i, status: "revoked" as const } : i));
      persistInvites(nextInvites);
      return { ok: true, message: "Invite revoked." };
    },
    [invites]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      isLoading,
      isAuthenticated,
      currentUser,
      users,
      invites,
      token,
      admin,
      login,
      signup,
      forgotPassword,
      logout,
      sendInvite,
      resendInvite,
      revokeInvite,
    }),
    [
      isLoading,
      isAuthenticated,
      currentUser,
      users,
      invites,
      token,
      admin,
      login,
      signup,
      forgotPassword,
      logout,
      sendInvite,
      resendInvite,
      revokeInvite,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
