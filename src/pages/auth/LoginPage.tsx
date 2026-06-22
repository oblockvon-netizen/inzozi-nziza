import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { PasswordField } from "@/components/auth/PasswordField";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, redirectForUser, ApiError } from "@/lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectForUser(user), { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { user: signedIn } = await authApi.login({ email, password });
      setUser(signedIn);
      navigate(redirectForUser(signedIn), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Checking session..." />;
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your community savings dashboard"
    >
      <AuthFormShell>
        {error && <AuthAlert variant="error" message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>

          <PasswordField
            id="login-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link
              to="/auth/forgot-password"
              className="text-sm text-accent hover:text-accent/80"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="h-11 w-full gap-2 bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/auth/signup" className="font-medium text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </AuthFormShell>
    </AuthLayout>
  );
}
