import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeroCardProps {
  badge?: ReactNode;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeroCard({
  badge,
  title,
  description,
  actions,
  className,
}: PageHeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/40 p-6 shadow-sm sm:p-8",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/10 blur-3xl dark:bg-accent/15" />
      <div className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-gold/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {badge}
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </motion.div>
  );
}
