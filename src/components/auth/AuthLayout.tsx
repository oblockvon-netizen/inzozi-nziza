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
    <div className="min-h-screen bg-[#0a0f1a] lg:grid lg:grid-cols-2">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
            <span className="text-xs font-bold text-accent">IN</span>
          </div>
          <span className="font-semibold text-white">Inzozi Nziza</span>
        </Link>
        <ThemeToggle className="border-white/15 bg-white/5 text-white/70" />
      </div>

      {/* Left branding — desktop only */}
      <div className="hidden lg:block">
        <AuthBrandingPanel />
      </div>

      {/* Right form panel */}
      <div className="relative flex min-h-[calc(100vh-65px)] flex-col lg:min-h-screen">
        <div className="absolute right-4 top-4 z-10 hidden lg:block">
          <ThemeToggle className="border-white/15 bg-white/5 text-white/70" />
        </div>

        <div className="absolute left-4 top-4 z-10">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-2 text-white/60 hover:bg-white/5 hover:text-white"
          >
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
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 text-sm text-white/50 sm:text-base">{subtitle}</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#111827]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
