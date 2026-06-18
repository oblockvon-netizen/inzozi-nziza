import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  index?: number;
  accent?: "default" | "emerald" | "gold" | "navy";
  className?: string;
}

const accentStyles = {
  default: "bg-muted/50 text-muted-foreground",
  emerald: "bg-accent/10 text-accent",
  gold: "bg-gold/10 text-gold",
  navy: "bg-primary/10 text-primary dark:text-primary-foreground",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  index = 0,
  accent = "default",
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5", accentStyles[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
