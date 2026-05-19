import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { clearLoginFlow, readLoginFlow } from "@/lib/loginFlowStorage";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function AuthenticatorScreen() {
  const { verifyTwoFactorLogin } = useAuth();
  const [, setLocation] = useLocation();
  const [tempToken, setTempToken] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const flow = readLoginFlow();
    if (!flow || flow.type !== "2fa") {
      setLocation("/login");
      return;
    }
    setTempToken(flow.tempToken);
  }, [setLocation]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code from Google Authenticator.");
      return;
    }
    if (!tempToken) {
      toast.error("Session expired. Please sign in again.");
      setLocation("/login");
      return;
    }

    setLoading(true);
    const result = await verifyTwoFactorLogin({ tempToken, code });
    setLoading(false);

    if (!result.ok) {
      toast.error(result.message ?? "Invalid authentication code.");
      return;
    }

    clearLoginFlow();
    toast.success("Welcome back.");
    setLocation("/");
  }

  function handleBack() {
    clearLoginFlow();
    setLocation("/login");
  }

  if (!tempToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md bg-card/90 border-border/50 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-qiko-indigo/15 text-qiko-indigo">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <CardTitle>Verification code</CardTitle>
              <CardDescription className="mt-1">
                Enter the 6-digit code from Google Authenticator to complete sign in.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border/40 bg-secondary/20 px-4 py-6">
              <Label htmlFor="auth-code" className="text-sm font-medium">
                Authenticator code
              </Label>
              <InputOTP
                id="auth-code"
                maxLength={6}
                value={code}
                onChange={setCode}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="size-11 text-base" />
                  <InputOTPSlot index={1} className="size-11 text-base" />
                  <InputOTPSlot index={2} className="size-11 text-base" />
                  <InputOTPSlot index={3} className="size-11 text-base" />
                  <InputOTPSlot index={4} className="size-11 text-base" />
                  <InputOTPSlot index={5} className="size-11 text-base" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
              {loading ? "Verifying…" : "Verify & sign in"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full gap-1.5 text-muted-foreground"
              disabled={loading}
              onClick={handleBack}
            >
              <ArrowLeft className="size-3.5" />
              Back to sign in
            </Button>
          </form>

          <div className="mt-4 flex justify-center text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors" onClick={clearLoginFlow}>
              Sign in with a different account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
