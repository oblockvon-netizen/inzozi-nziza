import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, meApi, ApiError } from "@/lib/api";
import { User } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading, setUser } = useAuth();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone ?? "");
    }
  }, [authLoading, user, navigate]);

  const updateProfile = async () => {
    setUpdating(true);
    try {
      const { user: updated } = await meApi.updateProfile({
        fullName,
        phone: phone || undefined,
      });
      setUser(updated);
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Update failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const updatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast({
        title: "Success",
        description: "Password changed. Please sign in again.",
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      navigate("/auth", { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Update failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || !user) {
    return <LoadingSpinner />;
  }

  return (
    <AppShell title="Profile settings" subtitle="Manage your account information">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-accent/10 p-3">
              <User className="h-8 w-8 text-accent" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Your profile</h2>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button onClick={updateProfile} disabled={updating} className="w-full">
              {updating ? "Updating..." : "Update profile"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
              />
            </div>
            <Button onClick={updatePassword} disabled={updating} className="w-full">
              {updating ? "Updating..." : "Update password"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
