import { createContext, useContext, useEffect, useMemo, useState } from "react";

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
}

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  users: AuthUser[];
  invites: AdminInvite[];
  login: (payload: LoginPayload) => Promise<{ ok: boolean; message?: string }>;
  signup: (payload: SignupPayload) => Promise<{ ok: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => void;
  sendInvite: (payload: InvitePayload) => Promise<{ ok: boolean; message: string }>;
  resendInvite: (inviteId: string) => Promise<{ ok: boolean; message: string }>;
  revokeInvite: (inviteId: string) => Promise<{ ok: boolean; message: string }>;
}

const STORAGE_KEYS = {
  users: "qiko_admin_users",
  session: "qiko_admin_session",
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const users = loadStoredUsers();
    const savedInvites = loadStoredInvites();
    const sessionId = localStorage.getItem(STORAGE_KEYS.session);
    const sessionUser = sessionId ? users.find((u) => u.id === sessionId) ?? null : null;

    setStoredUsers(users);
    setInvites(savedInvites);
    setCurrentUser(sessionUser ? stripPassword(sessionUser) : null);
    setIsLoading(false);
  }, []);

  const users = useMemo(() => storedUsers.map(stripPassword), [storedUsers]);

  const persistUsers = (next: StoredUser[]) => {
    setStoredUsers(next);
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(next));
  };

  const persistInvites = (next: AdminInvite[]) => {
    setInvites(next);
    localStorage.setItem(STORAGE_KEYS.invites, JSON.stringify(next));
  };

  const login: AuthContextType["login"] = async ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email);
    const user = storedUsers.find((u) => normalizeEmail(u.email) === normalizedEmail);
    if (!user || user.password !== password) {
      return { ok: false, message: "Invalid email or password." };
    }

    const nextUsers = storedUsers.map((u) =>
      u.id === user.id
        ? { ...u, lastLoginAt: new Date().toISOString() }
        : u
    );
    persistUsers(nextUsers);
    localStorage.setItem(STORAGE_KEYS.session, user.id);
    setCurrentUser(stripPassword({ ...user, lastLoginAt: new Date().toISOString() }));
    return { ok: true };
  };

  const signup: AuthContextType["signup"] = async ({ name, email, password }) => {
    const normalizedEmail = normalizeEmail(email);
    const exists = storedUsers.some((u) => normalizeEmail(u.email) === normalizedEmail);
    if (exists) {
      return { ok: false, message: "An account with this email already exists." };
    }

    const pendingInvite = invites.find(
      (invite) =>
        normalizeEmail(invite.email) === normalizedEmail &&
        invite.status === "pending"
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
        invite.id === pendingInvite.id
          ? { ...invite, status: "accepted" as const }
          : invite
      );
      persistInvites(nextInvites);
    }

    localStorage.setItem(STORAGE_KEYS.session, newUser.id);
    setCurrentUser(stripPassword(newUser));
    return { ok: true };
  };

  const forgotPassword: AuthContextType["forgotPassword"] = async (email) => {
    const normalizedEmail = normalizeEmail(email);
    const exists = storedUsers.some((u) => normalizeEmail(u.email) === normalizedEmail);
    if (!exists) {
      return { ok: false, message: "No account found with that email." };
    }
    return {
      ok: true,
      message: "Password reset link sent (simulated). Connect this handler to your API provider.",
    };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.session);
    setCurrentUser(null);
  };

  const sendInvite: AuthContextType["sendInvite"] = async ({ name, email }) => {
    if (!currentUser) {
      return { ok: false, message: "You must be logged in to invite users." };
    }
    const normalizedEmail = normalizeEmail(email);
    const alreadyUser = storedUsers.some((u) => normalizeEmail(u.email) === normalizedEmail);
    if (alreadyUser) {
      return { ok: false, message: "This user already has access." };
    }

    const hasPendingInvite = invites.some(
      (invite) =>
        normalizeEmail(invite.email) === normalizedEmail &&
        invite.status === "pending"
    );
    if (hasPendingInvite) {
      return { ok: false, message: "A pending invite already exists for this email." };
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
  };

  const resendInvite: AuthContextType["resendInvite"] = async (inviteId) => {
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
  };

  const revokeInvite: AuthContextType["revokeInvite"] = async (inviteId) => {
    const invite = invites.find((i) => i.id === inviteId);
    if (!invite || invite.status !== "pending") {
      return { ok: false, message: "Only pending invites can be revoked." };
    }
    const nextInvites = invites.map((i) =>
      i.id === inviteId ? { ...i, status: "revoked" as const } : i
    );
    persistInvites(nextInvites);
    return { ok: true, message: "Invite revoked." };
  };

  const value = useMemo<AuthContextType>(
    () => ({
      isLoading,
      isAuthenticated: !!currentUser,
      currentUser,
      users,
      invites,
      login,
      signup,
      forgotPassword,
      logout,
      sendInvite,
      resendInvite,
      revokeInvite,
    }),
    [isLoading, currentUser, users, invites]
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
