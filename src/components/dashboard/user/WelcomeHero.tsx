import { motion } from "framer-motion";
import { CreditCard, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getGreeting } from "@/lib/dashboard-analytics";
import type { AuthUser } from "@/types/api";

interface WelcomeHeroProps {
  user: AuthUser;
  onApplyLoan: () => void;
  onDownloadReport: () => void;
}

export function WelcomeHero({
  user,
  onApplyLoan,
  onDownloadReport,
}: WelcomeHeroProps) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-6 text-primary-foreground shadow-lg sm:p-8 dark:from-[#111827] dark:via-[#0f172a] dark:to-[#0a0f1a]"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-gold/10 blur-2xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="border-accent/30 bg-accent/20 text-accent-foreground hover:bg-accent/20">
              <Sparkles className="mr-1 h-3 w-3" />
              Member dashboard
            </Badge>
            {user.emailVerified && (
              <Badge variant="outline" className="border-white/20 text-primary-foreground/80">
                Verified
              </Badge>
            )}
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {getGreeting()}, {user.fullName.split(" ")[0]}
          </h2>
          <p className="mt-2 text-sm text-primary-foreground/70 dark:text-white/50">
            {today} · Track contributions, loans, and community activity
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={onApplyLoan}
            className="gap-2 bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90"
          >
            <CreditCard className="h-4 w-4" />
            Apply for loan
          </Button>
          <Button
            variant="outline"
            onClick={onDownloadReport}
            className="gap-2 border-white/20 bg-white/10 text-primary-foreground hover:bg-white/15 dark:text-white"
          >
            <Download className="h-4 w-4" />
            Download report
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
