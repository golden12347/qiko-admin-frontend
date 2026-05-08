import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminAcceptInvite } from "@/services/adminInviteAcceptApi";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function PasswordSet() {
  const [location, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const inviteEmail = useMemo(() => {
    const queryString = typeof window !== "undefined" ? window.location.search : "";
    const emailFromQuery = new URLSearchParams(queryString).get("email");
    return emailFromQuery?.trim() || "admin@example.com";
  }, [location]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error("Please enter password and confirm password.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Password and confirm password must match.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");
    try {
      const response = await adminAcceptInvite({
        email: inviteEmail,
        password,
        password_confirmation: confirmPassword,
      });
      const message = response?.message || "Password set successfully. You can now log in.";
      setSuccessMessage(message);
      toast.success(message);
      setPassword("");
      setConfirmPassword("");
      navigate("/login");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const message = ax?.response?.data?.message;
      toast.error(typeof message === "string" ? message : "Failed to set password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] rounded-lg border border-border/40 bg-card p-6">
        <h1 className="text-4xl font-bold font-heading tracking-tight">Set Admin Password</h1>
        <p className="text-muted-foreground mt-2 text-xl">{inviteEmail}</p>

        {successMessage && (
          <div className="mt-5 rounded-md border border-emerald-400/40 bg-emerald-400/15 px-4 py-3 text-emerald-300 text-lg">
            {successMessage}
          </div>
        )}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-lg">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-lg">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 text-base"
            />
          </div>

          <Button type="submit" className="w-full h-11 text-lg" disabled={loading}>
            {loading ? "Setting..." : "Set Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

