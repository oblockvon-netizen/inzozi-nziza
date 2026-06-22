import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { AuthBrandingPanel } from "./AuthBrandingPanel";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-background px-4 py-4 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
            <span className="text-xs font-bold text-accent">IN</span>
          </div>
          <span className="font-semibold text-foreground">Inzozi Nziza</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Left branding — desktop only */}
      <div className="hidden lg:block">
        <AuthBrandingPanel />
      </div>

      {/* Right form panel */}
      <div className="relative flex min-h-[calc(100vh-65px)] flex-col bg-background lg:min-h-screen">
        <div className="absolute right-4 top-4 z-10 hidden lg:block">
          <ThemeToggle />
        </div>

        <div className="absolute left-4 top-4 z-10">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
