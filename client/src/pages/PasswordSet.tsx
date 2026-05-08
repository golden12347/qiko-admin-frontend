import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminAcceptInvite } from "@/services/adminInviteAcceptApi";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordSet() {
  const [location, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const hasMismatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 text-base pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-lg">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 text-base pr-10"
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {hasMismatch && (
              <p className="text-sm text-rose-400">Password and confirm password must match.</p>
            )}
          </div>

          <Button type="submit" className="w-full h-11 text-lg" disabled={loading || hasMismatch}>
            {loading ? "Setting..." : "Set Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

