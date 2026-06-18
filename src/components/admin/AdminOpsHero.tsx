import { motion } from "framer-motion";
import { RefreshCw, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminOpsHeroProps {
  pendingCount: number;
  onRefresh: () => void;
  onExport: () => void;
  refreshing?: boolean;
}

export function AdminOpsHero({
  pendingCount,
  onRefresh,
  onExport,
  refreshing,
}: AdminOpsHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-6 text-primary-foreground shadow-lg dark:from-[#111827] dark:via-[#0f172a] dark:to-[#0a0f1a]"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold/15 blur-3xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge className="mb-3 border-gold/30 bg-gold/15 text-gold hover:bg-gold/15">
            <Shield className="mr-1 h-3 w-3" />
            Operations center
          </Badge>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Community finance command center
          </h2>
          <p className="mt-2 text-sm text-primary-foreground/70 dark:text-white/50">
            Manage members, contributions, loans, and fines —{" "}
            {pendingCount > 0 ? (
              <span className="font-medium text-gold">
                {pendingCount} item{pendingCount !== 1 ? "s" : ""} need approval
              </span>
            ) : (
              "all queues clear"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={refreshing}
            className="gap-2 border-white/20 bg-white/10 text-primary-foreground hover:bg-white/15 dark:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={onExport}
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <FileText className="h-4 w-4" />
            Export report
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
