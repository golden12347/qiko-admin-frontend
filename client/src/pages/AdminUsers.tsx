import { FormEvent, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MailPlus, RefreshCw, UserRound, XCircle } from "lucide-react";
import { AdminInvite, useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const roleBadge: Record<string, string> = {
  owner: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  admin: "bg-qiko-indigo/15 text-qiko-indigo border-qiko-indigo/30",
  analyst: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/30",
};

const inviteStatusBadge: Record<string, string> = {
  pending: "bg-qiko-warning/15 text-qiko-warning border-qiko-warning/30",
  accepted: "bg-qiko-success/15 text-qiko-success border-qiko-success/30",
  revoked: "bg-muted/40 text-muted-foreground border-border/30",
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function AdminUsers() {
  const { users, invites, sendInvite, resendInvite, revokeInvite } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const pendingInvites = useMemo(() => invites.filter((invite) => invite.status === "pending"), [invites]);

  async function handleInviteSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await sendInvite({ name, email });
    setLoading(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setName("");
    setEmail("");
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight">Admin Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage panel access, roles, and invitations.
        </p>
      </div>

      <Card className="bg-card/80 border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Invite User</CardTitle>
          <CardDescription>Add full name and email to invite a user.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInviteSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Full name</Label>
              <Input
                id="invite-name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="new-admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-3 flex items-center justify-end">
              <Button type="submit" disabled={loading} className="gap-1.5">
                <MailPlus className="size-3.5" />
                {loading ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="invites">Invites ({invites.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="bg-card/80 border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Active Admin Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={roleBadge[user.role]}>
                      {user.role}
                    </Badge>
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
              {invites.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
                  No invitations sent yet.
                </div>
              )}

              {invites.map((invite) => (
                <div key={invite.id} className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{invite.name || invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {invite.email} • {formatDate(invite.invitedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={inviteStatusBadge[invite.status]}>
                        <UserRound className="size-3 mr-1" />
                        {invite.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    {invite.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleResend(invite)}>
                          <RefreshCw className="size-3.5" />
                          Resend
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={() => handleRevoke(invite)}>
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
    </div>
  );
}
