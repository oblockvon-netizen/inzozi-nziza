import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant = "default" | "secondary" | "destructive" | "outline";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

function getStatusVariant(status: string): StatusVariant {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case "completed":
    case "approved":
    case "paid":
    case "repaid":
    case "disbursed":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
    case "denied":
    case "cancelled":
    case "overdue":
    case "defaulted":
      return "destructive";
    default:
      return "outline";
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={getStatusVariant(status)}
      className={cn("capitalize tabular-nums", className)}
    >
      {status.toLowerCase()}
    </Badge>
  );
}
