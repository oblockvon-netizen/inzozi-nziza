import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

export function GlassPanel({ children, className }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-card/80 p-6 shadow-xl backdrop-blur-xl sm:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}
