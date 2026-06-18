import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed border-border/60 bg-muted/10", className)}>
      <CardContent
        className={cn(
          "flex flex-col items-center text-center",
          compact ? "py-10" : "py-16"
        )}
        role="status"
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
          <Icon className="h-6 w-6 text-muted-foreground/60" aria-hidden="true" />
        </div>
        <p className="font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
