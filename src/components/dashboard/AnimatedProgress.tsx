import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
}

export function AnimatedProgress({
  value,
  className,
  barClassName,
  showLabel = false,
}: AnimatedProgressProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="tabular-nums font-medium text-foreground">
            {clamped.toFixed(0)}%
          </span>
        </div>
      )}
      <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent/80 to-accent",
            barClassName
          )}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  );
}
