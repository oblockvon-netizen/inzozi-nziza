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
import { evaluatePasswordStrength, passwordsMatch } from "@/lib/password-strength";
import {
  normalizeRwandaPhone,
  isValidRwandaPhone,
  RWANDA_PHONE_ERROR,
  RWANDA_PHONE_HINT,
} from "@/lib/phone-validation";

export default function SignupPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, setUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectForUser(user), { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPhoneError(null);

    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      return;
    }

    if (!isValidRwandaPhone(phone)) {
      setPhoneError(RWANDA_PHONE_ERROR);
      return;
    }

    const strength = evaluatePasswordStrength(password);
    if (strength.score < 4) {
      setError("Please meet all password requirements before signing up.");
      return;
    }

    if (!passwordsMatch(password, confirmPassword)) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizeRwandaPhone(phone.trim());
      if (!normalizedPhone) {
        setPhoneError(RWANDA_PHONE_ERROR);
        setLoading(false);
        return;
      }
      const { user: newUser } = await authApi.signup({
        email,
        password,
        fullName: fullName.trim(),
        phone: normalizedPhone,
      });
      setUser(newUser);
      navigate(redirectForUser(newUser), {
        replace: true,
        state: { pendingSignup: true },
      });
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Full name</Label>
            <Input
              id="signup-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
              minLength={2}
              placeholder="Jean-Paul Mugisha"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-phone">Phone</Label>
            <Input
              id="signup-phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) setPhoneError(null);
              }}
              autoComplete="tel"
              required
              placeholder="+250 788 123 456"
              aria-invalid={!!phoneError}
            />
            <p className={`text-xs ${phoneError ? "text-destructive" : "text-muted-foreground"}`}>
              {phoneError ?? RWANDA_PHONE_HINT}
            </p>
          </div>

          <PasswordField
            id="signup-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={password} />

          <PasswordField
            id="signup-confirm"
            label="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            placeholder="Re-enter your password"
          />
          {confirmPassword && !passwordsMatch(password, confirmPassword) && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}

          <Button
            type="submit"
            className="h-11 w-full gap-2 bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </AuthFormShell>
    </AuthLayout>
  );
}
