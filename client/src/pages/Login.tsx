import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await login({ email, password });
    setLoading(false);

    if (!result.ok) {
      toast.error(result.message ?? "Unable to sign in.");
      return;
    }

    toast.success("Welcome back.");
    setLocation("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md bg-card/90 border-border/50">
        <CardHeader>
          <CardTitle>Admin Sign In</CardTitle>
          <CardDescription>Use your admin credentials to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <Link href="/forgot-password" className="hover:text-foreground transition-colors">
              Forgot password?
            </Link>
            <span>
              New here?{" "}
              <Link href="/signup" className="text-qiko-indigo hover:underline">
                Create account
              </Link>
            </span>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground/80">
            Sign in with your admin API credentials (backend at <span className="font-mono">127.0.0.1:8002</span>).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
