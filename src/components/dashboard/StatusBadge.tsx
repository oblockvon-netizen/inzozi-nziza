import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant = "default" | "secondary" | "destructive" | "outline";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

function getStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "completed":
    case "approved":
    case "paid":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
    case "denied":
    case "cancelled":
    case "overdue":
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
      {status}
    </Badge>
  );
}
