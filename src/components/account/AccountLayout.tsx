import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AccountSidebar } from "./AccountSidebar";
import type { AuthUser } from "@/types/api";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { motionTransition } from "@/lib/motion";

interface AccountLayoutProps {
  user: AuthUser;
  onSignOut?: () => void;
  title?: string;
  children: ReactNode;
}

export function AccountLayout({
  user,
  onSignOut,
  title = "Account",
  children,
}: AccountLayoutProps) {
  const location = useLocation();
  const reduced = useReducedMotion();
  return (
    <AppShell title={title} subtitle={user.fullName} onSignOut={onSignOut}>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="order-2 lg:order-1">
          <AccountSidebar user={user} />
        </div>
        <motion.div
          key={location.pathname}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionTransition(reduced, { duration: 0.35 })}
          className="order-1 lg:order-2"
        >
          {children}
        </motion.div>
      </div>
    </AppShell>
  );
}