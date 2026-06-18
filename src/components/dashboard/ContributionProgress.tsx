import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContributionProgressProps {
  current: number;
  required: number;
  progressPercent: number;
  monthLabel?: string;
  className?: string;
}

export function ContributionProgress({
  current,
  required,
  progressPercent,
  monthLabel,
  className,
}: ContributionProgressProps) {
  const complete = progressPercent >= 100;
  const remaining = Math.max(required - current, 0);

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Monthly contribution
          </p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {current.toLocaleString()}{" "}
            <span className="text-base font-normal text-muted-foreground">
              / {required.toLocaleString()} RWF
            </span>
          </p>
        </div>
        <p className="text-sm font-medium tabular-nums text-accent">
          {Math.min(progressPercent, 100).toFixed(0)}%
        </p>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            complete ? "bg-accent" : "bg-gradient-to-r from-accent/80 to-accent"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progressPercent, 100)}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>

      {complete ? (
        <div className="flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Monthly target complete</p>
            <p className="text-muted-foreground">
              {monthLabel
                ? `You've met your requirement for ${monthLabel}.`
                : "You've met your monthly requirement."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground tabular-nums">
            {remaining.toLocaleString()} RWF remaining
          </p>
          <div className="flex items-start gap-3 rounded-lg border border-gold/20 bg-gold/5 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p className="text-sm text-muted-foreground">
              Complete your contribution to maintain active membership this month.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
