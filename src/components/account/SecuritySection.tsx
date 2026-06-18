import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { useToast } from "@/hooks/use-toast";
import { authApi, ApiError } from "@/lib/api";
import { evaluatePasswordStrength, passwordsMatch } from "@/lib/password-strength";
import { Loader2, Shield } from "lucide-react";

export function SecuritySection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    const strength = evaluatePasswordStrength(newPassword);
    if (strength.score < 4) {
      toast({
        title: "Weak password",
        description: "Meet all password requirements before saving.",
        variant: "destructive",
      });
      return;
    }
    if (!passwordsMatch(newPassword, confirmPassword)) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast({
        title: "Password updated",
        description: "Please sign in again with your new password.",
      });
      navigate("/auth/login", { replace: true });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof ApiError ? error.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          Security
        </CardTitle>
        <CardDescription>Change your password and protect your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PasswordField
          id="current-pw"
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
        />
        <PasswordField
          id="new-pw"
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
        />
        <PasswordStrengthMeter password={newPassword} />
        <PasswordField
          id="confirm-pw"
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
        {confirmPassword && !passwordsMatch(newPassword, confirmPassword) && (
          <p className="text-xs text-destructive">Passwords do not match</p>
        )}
        <Button
          onClick={handleChangePassword}
          disabled={saving}
          className="gap-2 bg-accent hover:bg-accent/90"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Update password
        </Button>
      </CardContent>
    </Card>
  );
}
