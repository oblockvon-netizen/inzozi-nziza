import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { authApi, ApiError } from "@/lib/api";

type VerifyState = "loading" | "success" | "error" | "idle";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<VerifyState>(token ? "loading" : "idle");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    (async () => {
      try {
        const result = await authApi.verifyEmail(token);
        if (!cancelled) {
          setState("success");
          setMessage(result.message);
        }
      } catch (err) {
        if (!cancelled) {
          setState("error");
          setMessage(
            err instanceof ApiError ? err.message : "Email verification failed"
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);
    try {
      await authApi.resendVerification(resendEmail || undefined);
      setResendSent(true);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Failed to resend email");
    } finally {
      setResendLoading(false);
    }
  };

  if (state === "loading") {
    return (
      <AuthLayout title="Verifying email" subtitle="Please wait a moment...">
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-sm text-white/50">Confirming your email address...</p>
        </div>
      </AuthLayout>
    );
  }

  if (state === "success") {
    return (
      <AuthLayout title="Email verified" subtitle="Your account is ready to go">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 ring-2 ring-accent/30">
            <CheckCircle2 className="h-7 w-7 text-accent" />
          </div>
          <AuthAlert variant="success" title="Verified" message={message} />
          <Button
            asChild
            className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Link to="/auth/login">Continue to sign in</Link>
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  if (state === "error") {
    return (
      <AuthLayout
        title="Verification failed"
        subtitle="We couldn't verify your email address"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 ring-2 ring-red-500/30">
              <XCircle className="h-7 w-7 text-red-400" />
            </div>
            <AuthAlert variant="error" message={message} />
          </div>

          {resendSent ? (
            <AuthAlert
              variant="success"
              title="Email sent"
              message="Check your inbox for a new verification link."
            />
          ) : (
            <form onSubmit={handleResend} className="space-y-4">
              <p className="text-sm text-white/50">
                Enter your email to receive a new verification link:
              </p>
              <div className="space-y-2">
                <Label htmlFor="resend-email" className="text-white/80">
                  Email
                </Label>
                <Input
                  id="resend-email"
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-accent"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="h-11 w-full gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10"
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Resend verification email
              </Button>
            </form>
          )}

          <Button
            asChild
            variant="ghost"
            className="w-full text-white/60 hover:text-white"
          >
            <Link to="/auth/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // No token — manual resend page
  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Check your inbox or request a new verification link"
    >
      <div className="space-y-6">
        <AuthAlert
          variant="info"
          message="Open the verification link from your signup email, or request a new one below."
        />

        {resendSent ? (
          <AuthAlert
            variant="success"
            title="Email sent"
            message="Check your inbox for a new verification link."
          />
        ) : (
          <form onSubmit={handleResend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resend-email-idle" className="text-white/80">
                Email
              </Label>
              <Input
                id="resend-email-idle"
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-accent"
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={resendLoading}
            >
              {resendLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Resend verification email
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-white/50">
          <Link to="/auth/login" className="font-medium text-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
