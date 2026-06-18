import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { authApi, ApiError } from "@/lib/api";
import { evaluatePasswordStrength, passwordsMatch } from "@/lib/password-strength";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset link is invalid or missing. Request a new one.");
      return;
    }

    const strength = evaluatePasswordStrength(password);
    if (strength.score < 4) {
      setError("Please meet all password requirements.");
      return;
    }

    if (!passwordsMatch(password, confirmPassword)) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (!token && !done) {
    return (
      <AuthLayout
        title="Invalid reset link"
        subtitle="This password reset link is missing or expired"
      >
        <AuthAlert
          variant="error"
          message="Please request a new password reset link."
        />
        <Button
          asChild
          className="mt-6 h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Link to="/auth/forgot-password">Request new link</Link>
        </Button>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout
        title="Password updated"
        subtitle="Your password has been reset successfully"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 ring-2 ring-accent/30">
            <CheckCircle2 className="h-7 w-7 text-accent" />
          </div>
          <AuthAlert
            variant="success"
            title="All set"
            message="You can now sign in with your new password."
          />
          <Button
            asChild
            className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Link to="/auth/login">Sign in</Link>
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password for your account"
    >
      <AuthFormShell showGoogle={false}>
        {error && <AuthAlert variant="error" message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            id="reset-password"
            label="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={password} />

          <PasswordField
            id="reset-confirm"
            label="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
          {confirmPassword && !passwordsMatch(password, confirmPassword) && (
            <p className="text-xs text-red-400">Passwords do not match</p>
          )}

          <Button
            type="submit"
            className="h-11 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Reset password
          </Button>
        </form>
      </AuthFormShell>
    </AuthLayout>
  );
}
