import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  compact?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  className,
  compact = false,
}: ErrorStateProps) {
  return (
    <Card
      className={cn("border-destructive/30 bg-destructive/5", className)}
      role="alert"
      aria-live="assertive"
    >
      <CardContent
        className={cn(
          "flex flex-col items-center text-center",
          compact ? "py-8" : "py-12"
        )}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="mt-4 gap-2"
            aria-label={retryLabel}
          >
            <RefreshCw className="h-4 w-4" />
            {retryLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
