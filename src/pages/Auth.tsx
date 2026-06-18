import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, UserPlus, Shield, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("user");
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in and redirect based on role
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if user is admin
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        const isAdmin = userRoles?.some(roleData => roleData.role === 'admin');
        
        if (isAdmin) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      }
    };
    checkUser().finally(() => setPageLoading(false));
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check admin key if role is admin
      if (role === "admin" && adminKey !== "INZOZI_ADMIN_2024") {
        throw new Error("Invalid admin key");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            phone: phone,
            role: role
          }
        }
      });

      if (error) throw error;

      // If admin signup is successful, assign admin role
      if (data.user && role === "admin") {
        setPageLoading(true);
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: 'admin'
        });
        
        // Also approve the admin immediately
        await supabase.from('profiles').update({
          is_approved: true
        }).eq('user_id', data.user.id);
      }

      toast({
        title: "Account created successfully!",
        description: role === "admin" 
          ? "Admin account created and approved automatically."
          : "Please check your email for verification. Your account requires admin approval to access the platform.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setPageLoading(true);
        // Check if user is admin
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        const isAdmin = userRoles?.some(roleData => roleData.role === 'admin');
        
        if (isAdmin) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions",
      });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <LoadingSpinner message="Redirecting to your dashboard..." />;
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
              <div className="animate-fade-in">
                <h3 className="text-lg font-semibold mb-4">Reset Password</h3>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="transition-all duration-200 focus:border-primary"
                    />
                  </div>
                  <Button type="submit" className="w-full transition-all duration-200 hover:scale-105" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Send Reset Email"
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="link" 
                    onClick={() => setIsForgotPassword(false)}
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                </form>
              </div>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin" className="transition-all duration-200">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="transition-all duration-200">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="animate-fade-in">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="transition-all duration-200 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="transition-all duration-200 focus:border-primary pr-10"
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
                    <Button type="submit" className="w-full transition-all duration-200 hover:scale-105" disabled={loading}>
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Sign In
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="link" 
                      onClick={() => setIsForgotPassword(true)}
                      className="w-full"
                    >
                      Forgot Password?
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="animate-fade-in">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="transition-all duration-200 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="transition-all duration-200 focus:border-primary pr-10"
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
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Full Name</Label>
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="transition-all duration-200 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="transition-all duration-200 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Type</Label>
                      <RadioGroup value={role} onValueChange={setRole} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="user" id="user" />
                          <Label htmlFor="user">User</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="admin" id="admin" />
                          <Label htmlFor="admin">Admin</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {role === "admin" && (
                      <div className="space-y-2">
                        <Label htmlFor="admin-key">Admin Key</Label>
                        <Input
                          id="admin-key"
                          type="password"
                          placeholder="Enter admin key"
                          value={adminKey}
                          onChange={(e) => setAdminKey(e.target.value)}
                          required
                          className="transition-all duration-200 focus:border-primary"
                        />
                      </div>
                    )}
                    <Button type="submit" className="w-full transition-all duration-200 hover:scale-105" disabled={loading}>
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Sign Up
                        </>
                      )}
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