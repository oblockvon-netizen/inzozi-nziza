import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { meApi, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Palette, Bell, Shield, LogOut, Monitor } from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleRevokeOthers = async () => {
    try {
      const { count } = await meApi.revokeOtherSessions();
      toast({ title: "Sessions revoked", description: `${count} other device(s) signed out.` });
    } catch (error) {
      toast({
        title: "Failed",
        description: error instanceof ApiError ? error.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login", { replace: true });
  };

  if (loading || !user) return <LoadingSpinner />;

  return (
    <AppShell title="Settings" subtitle="App preferences" onSignOut={handleSignOut}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl space-y-6"
      >
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-accent" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how Inzozi Nziza looks</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-gold" />
              Notifications
            </CardTitle>
            <CardDescription>Manage alerts and your inbox</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/notifications">Open notification center</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/profile/preferences">Notification preferences</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-accent" />
              Privacy & security
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/profile/security">Change password</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/profile/sessions">
                <Monitor className="mr-2 h-4 w-4" />
                Manage sessions
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Danger zone</CardTitle>
            <CardDescription>Sign out from all other devices or this session</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleRevokeOthers}>
              Sign out all other devices
            </Button>
            <Button variant="destructive" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AppShell>
  );
}
