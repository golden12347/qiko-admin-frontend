import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MailPlus, RefreshCw, Trash2, UserRound, XCircle } from "lucide-react";
import { AdminInvite, useAuth } from "@/contexts/AuthContext";
import { adminUsersList, adminDeleteAdminUser, type AdminUserNameItem } from "@/services/adminUsersListApi";
import {
  ADMIN_INVITE_ROLE_OPTIONS,
  type AdminInviteRole,
} from "@/services/adminUsersApi";
import { useGlobalDateFilter } from "@/contexts/DateFilterContext";
import { toast } from "sonner";
import { AdminInvitesListSkeleton, AdminUsersListSkeleton } from "@/components/tabPageSkeletons";
import { useIsSuperAdmin } from "@/store/hooks";

const roleBadge: Record<string, string> = {
  owner: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  super_admin: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  admin: "bg-qiko-indigo/15 text-qiko-indigo border-qiko-indigo/30",
  viewer: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/30",
  analyst: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/30",
};

const inviteStatusBadge: Record<string, string> = {
  pending: "bg-qiko-warning/15 text-qiko-warning border-qiko-warning/30",
  accepted: "bg-qiko-success/15 text-qiko-success border-qiko-success/30",
  revoked: "bg-muted/40 text-muted-foreground border-border/30",
  send: "bg-qiko-success/15 text-qiko-success border-qiko-success/30",
  sent: "bg-qiko-success/15 text-qiko-success border-qiko-success/30",
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function normalizeRoleKey(role: string | undefined): string {
  return (role ?? "admin").trim().toLowerCase().replace(/\s+/g, "_");
}

function formatRoleLabel(role: string | undefined): string {
  const r = normalizeRoleKey(role);
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    viewer: "Viewer",
    owner: "Owner",
    analyst: "Analyst",
  };
  return labels[r] ?? (role?.trim() || "Admin");
}

function inviteStatusBadgeKey(status: string | undefined): string {
  const s = (status ?? "pending").trim().toLowerCase();
  if (s === "send" || s === "sent") return "send";
  return s;
}

function formatInviteStatusLabel(status: string | undefined): string {
  const s = (status ?? "pending").trim().toLowerCase();
  if (s === "send" || s === "sent") return "Invite Sent";
  if (s === "pending") return "Pending";
  if (s === "accepted") return "Accepted";
  if (s === "revoked") return "Revoked";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Pending";
}

export default function AdminUsers() {
  const { users, invites, sendInvite, resendInvite, revokeInvite } = useAuth();
  const isSuperAdmin = useIsSuperAdmin();
  const { filter } = useGlobalDateFilter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminInviteRole>("viewer");
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [apiRows, setApiRows] = useState<AdminUserNameItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAdminUsers = useCallback(async () => {
    setApiLoading(true);
    try {
      const rows = await adminUsersList(filter);
      setApiRows(rows);
      setApiLoaded(true);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const message = ax?.response?.data?.message;
      toast.error(typeof message === "string" ? message : "Failed to fetch admin users.");
      setApiRows([]);
      setApiLoaded(false);
    } finally {
      setApiLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    (async () => {
      await fetchAdminUsers();
    })();
  }, [fetchAdminUsers]);

  const apiActiveUsers = useMemo(
    () =>
      apiRows
        .filter((row) => row.status === true && String(row.invite_status ?? "").toLowerCase() === "accepted")
        .map((row) => ({
          id: row.id != null && String(row.id).trim() !== "" ? String(row.id) : "",
          name: String(row.name ?? "—"),
          email: String(row.email ?? "—"),
          role: String(row.role_name ?? "admin"),
        })),
    [apiRows]
  );

  const apiInvitationHistory = useMemo(
    () =>
      apiRows
        .filter((row) => !(row.status === true && String(row.invite_status ?? "").toLowerCase() === "accepted"))
        .map((row) => ({
          id: String(row.id ?? crypto.randomUUID()),
          name: String(row.name ?? "—"),
          email: String(row.email ?? "—"),
          status: String(row.invite_status ?? "pending").toLowerCase(),
          invitedAt: String(row.created_at ?? ""),
        })),
    [apiRows]
  );

  const displayUsers = apiLoaded ? apiActiveUsers : users;
  const displayInvites = apiLoaded ? apiInvitationHistory : invites;

  const pendingInvites = useMemo(
    () => displayInvites.filter((invite) => String((invite as { status?: string }).status ?? "").toLowerCase() === "pending"),
    [displayInvites]
  );

  async function handleInviteSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await sendInvite({ name, email, role: inviteRole });
    setLoading(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setName("");
    setEmail("");
    setInviteRole("viewer");
    await fetchAdminUsers();
  }

  async function handleResend(invite: AdminInvite) {
    const result = await resendInvite(invite.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(`Invite resent to ${invite.email}`);
  }

  async function handleRevoke(invite: AdminInvite) {
    const result = await revokeInvite(invite.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(`Invite revoked for ${invite.email}`);
  }

  function handleDeleteAdminUser(user: { id: string; name: string; email: string }) {
    if (!isSuperAdmin) {
      toast.error("Only Super Admin can delete admin users.");
      return;
    }
    setDeleteTarget(user);
  }

  async function confirmDeleteAdminUser() {
    if (!isSuperAdmin) {
      toast.error("Only Super Admin can delete admin users.");
      return;
    }
    if (!deleteTarget?.id) {
      toast.error("Missing user id; cannot delete.");
      return;
    }
    setDeleteLoading(true);
    try {
      await adminDeleteAdminUser(deleteTarget.id);
      toast.success(`Removed ${deleteTarget.email}`);
      setDeleteTarget(null);
      await fetchAdminUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const message = ax?.response?.data?.message;
      toast.error(typeof message === "string" ? message : "Failed to delete admin user.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight">Admin Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage panel access, roles, and invitations.
        </p>
      </div>

      {isSuperAdmin && (
      <Card className="bg-card/80 border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Invite User</CardTitle>
          <CardDescription>Add name, email, and role to invite a panel user.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInviteSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Full name</Label>
              <Input
                id="invite-name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as AdminInviteRole)}
              >
                <SelectTrigger id="invite-role" className="w-full bg-secondary/30 border-border/30">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_INVITE_ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-end">
              <Button type="submit" disabled={loading} className="gap-1.5 w-full md:w-auto">
                <MailPlus className="size-3.5" />
                {loading ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="users">Users ({displayUsers.length})</TabsTrigger>
          <TabsTrigger value="invites">Invites ({displayInvites.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="bg-card/80 border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Active Admin Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {apiLoading && <AdminUsersListSkeleton rows={5} />}
              {!apiLoading && displayUsers.map((user) => (
                <div key={user.id || user.email} className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={roleBadge[normalizeRoleKey((user as { role?: string }).role)]}
                    >
                      {formatRoleLabel((user as { role?: string }).role)}
                    </Badge>
                    {isSuperAdmin && displayUsers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={!apiLoaded || !user.id}
                        onClick={() => handleDeleteAdminUser(user)}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites">
          <Card className="bg-card/80 border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Invitation History</CardTitle>
              <CardDescription>{pendingInvites.length} pending invitations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!apiLoading && displayInvites.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
                  No invitations sent yet.
                </div>
              )}

              {apiLoading && <AdminInvitesListSkeleton rows={5} />}

              {!apiLoading && displayInvites.map((invite) => (
                <div key={invite.id} className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{invite.name || invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {invite.email} • {formatDate(invite.invitedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          inviteStatusBadge[inviteStatusBadgeKey((invite as { status?: string }).status)] ??
                          inviteStatusBadge.pending
                        }
                      >
                        <UserRound className="size-3 mr-1" />
                        {formatInviteStatusLabel((invite as { status?: string }).status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    {!apiLoaded && invite.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleResend(invite as AdminInvite)}>
                          <RefreshCw className="size-3.5" />
                          Resend
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={() => handleRevoke(invite as AdminInvite)}>
                          <XCircle className="size-3.5" />
                          Revoke
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete admin user?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  This will remove <span className="text-foreground font-medium">{deleteTarget.name}</span> (
                  {deleteTarget.email}) from admin access. This cannot be undone.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteLoading || !deleteTarget?.id}
              onClick={() => void confirmDeleteAdminUser()}
            >
              {deleteLoading ? "Deleting…" : "Yes"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
