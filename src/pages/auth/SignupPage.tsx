import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, redirectForUser, ApiError } from "@/lib/api";
import { evaluatePasswordStrength } from "@/lib/password-strength";

export default function SignupPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, setUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectForUser(user), { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const strength = evaluatePasswordStrength(password);
    if (strength.score < 4) {
      setError("Please meet all password requirements before signing up.");
      return;
    }

    setLoading(true);
    try {
      const { user: newUser } = await authApi.signup({
        email,
        password,
        fullName,
        phone: phone || undefined,
      });
      setUser(newUser);
      setSuccess(
        "Account created! Check your email to verify. Your membership requires admin approval."
      );
      setTimeout(() => {
        navigate(redirectForUser(newUser), { replace: true });
      }, 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Checking session..." />;
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join your community savings group on Inzozi Nziza"
    >
      <AuthFormShell>
        {error && <AuthAlert variant="error" message={error} />}
        {success && <AuthAlert variant="success" title="Success" message={success} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name" className="text-white/80">
              Full name
            </Label>
            <Input
              id="signup-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
              placeholder="Jean-Paul Mugisha"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-accent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-white/80">
              Email
            </Label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-accent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-phone" className="text-white/80">
              Phone <span className="text-white/40">(optional)</span>
            </Label>
            <Input
              id="signup-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="+250 788 000 000"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-accent"
            />
          </div>

          <PasswordField
            id="signup-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={password} />

          <Button
            type="submit"
            className="h-11 w-full gap-2 bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90"
            disabled={loading || !!success}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </AuthFormShell>
    </AuthLayout>
  );
}
