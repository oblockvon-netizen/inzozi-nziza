import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, redirectForUser, ApiError } from "@/lib/api";
import { Loader2, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectForUser(user), { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user: newUser } = await authApi.signup({
        email,
        password,
        fullName,
        phone: phone || undefined,
      });
      setUser(newUser);
      toast({
        title: "Account created",
        description:
          "Check your email for verification. Your account requires admin approval.",
      });
      navigate(redirectForUser(newUser), { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Sign up failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user: signedIn } = await authApi.login({ email, password });
      setUser(signedIn);
      navigate(redirectForUser(signedIn), { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Sign in failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast({
        title: "Password reset email sent",
        description: "If an account exists, check your email for instructions.",
      });
      setIsForgotPassword(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Request failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Checking session..." />;
  }

  return (
    <MarketingLayout showBack backTo="/" backLabel="Home">
      <div className="flex min-h-screen items-center justify-center p-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-accent">
              Inzozi Nziza
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sign in or create your member account
            </p>
          </div>

          <GlassPanel>
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl">Account access</CardTitle>
              <CardDescription>
                Secure access to your community savings dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {isForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send reset email
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setIsForgotPassword(false)}
                    className="w-full"
                  >
                    Back to sign in
                  </Button>
                </form>
              ) : (
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="mb-6 grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign in</TabsTrigger>
                    <TabsTrigger value="signup">Sign up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="signin-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full gap-2" disabled={loading}>
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogIn className="h-4 w-4" />
                        )}
                        Sign in
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setIsForgotPassword(true)}
                        className="w-full"
                      >
                        Forgot password?
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="full-name">Full name</Label>
                        <Input
                          id="full-name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full gap-2" disabled={loading}>
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                        Create account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </GlassPanel>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default Auth;
