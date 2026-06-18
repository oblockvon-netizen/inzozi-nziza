import type { LucideIcon } from "lucide-react";
import { AnimatedCard } from "@/components/ux/AnimatedCard";
import { CountUp } from "@/components/ux/CountUp";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  index?: number;
  accent?: "default" | "emerald" | "gold" | "navy";
  className?: string;
  countUp?: number;
  countUpFormatter?: (value: number) => string;
  countUpSuffix?: string;
  countUpPrefix?: string;
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
  countUp,
  countUpFormatter,
  countUpSuffix,
  countUpPrefix,
}: StatCardProps) {
  return (
    <AnimatedCard
      index={index}
      className={cn(
        "rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {countUp !== undefined ? (
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              <CountUp
                value={countUp}
                formatter={countUpFormatter}
                suffix={countUpSuffix}
                prefix={countUpPrefix}
              />
            </p>
          ) : (
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {value}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5", accentStyles[accent])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </AnimatedCard>
  );
}
