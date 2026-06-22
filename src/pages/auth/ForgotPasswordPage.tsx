import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { authApi, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent password reset instructions if an account exists"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 ring-2 ring-accent/30">
            <Mail className="h-7 w-7 text-accent" />
          </div>
          <AuthAlert
            variant="success"
            title="Email sent"
            message={`If an account exists for ${email}, you'll receive reset instructions shortly.`}
          />
          <Button
            asChild
            className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Link to="/auth/login">Back to sign in</Link>
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <AuthFormShell showGoogle={false}>
        {error && <AuthAlert variant="error" message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>

          <Button
            type="submit"
            className="h-11 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link to="/auth/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </AuthFormShell>
    </AuthLayout>
  );
}
