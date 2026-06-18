import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/layout/PageTransition";
import { SkipLink } from "@/components/ux/SkipLink";
import { ErrorBoundary } from "@/components/ux/ErrorBoundary";
import Index from "./pages/Index";
import AuthRoutes from "./pages/auth/AuthRoutes";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProfileLayout from "./pages/ProfileLayout";
import Settings from "./pages/Settings";
import NotificationCenter from "./pages/NotificationCenter";
import NotFound from "./pages/NotFound";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PersonalInfoSection } from "@/components/account/PersonalInfoSection";
import { SecuritySection } from "@/components/account/SecuritySection";
import { SessionsSection } from "@/components/account/SessionsSection";
import { NotificationPreferencesSection } from "@/components/account/NotificationPreferencesSection";

const queryClient = new QueryClient();

function withTransition(element: React.ReactNode) {
  return <PageTransition>{element}</PageTransition>;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={withTransition(<Index />)} />
        <Route path="/auth/*" element={withTransition(<AuthRoutes />)} />
        <Route path="/dashboard" element={withTransition(<Dashboard />)} />
        <Route path="/admin" element={withTransition(<AdminDashboard />)} />
        <Route path="/profile" element={withTransition(<ProfileLayout />)}>
          <Route index element={<PersonalInfoSection />} />
          <Route path="security" element={<SecuritySection />} />
          <Route path="sessions" element={<SessionsSection />} />
          <Route path="preferences" element={<NotificationPreferencesSection />} />
          <Route path="*" element={<Navigate to="/profile" replace />} />
        </Route>
        <Route path="/settings" element={withTransition(<Settings />)} />
        <Route path="/notifications" element={withTransition(<NotificationCenter />)} />
        <Route path="*" element={withTransition(<NotFound />)} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <SkipLink />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AnimatedRoutes />
              </BrowserRouter>
            </ErrorBoundary>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
