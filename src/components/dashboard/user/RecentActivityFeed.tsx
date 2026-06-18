import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/ux/EmptyState";
import { Activity, AlertCircle, CreditCard, DollarSign } from "lucide-react";
import type { ActivityItem } from "@/lib/dashboard-analytics";
import { cn } from "@/lib/utils";

const typeConfig = {
  contribution: {
    icon: DollarSign,
    color: "bg-accent/10 text-accent",
  },
  loan: {
    icon: CreditCard,
    color: "bg-gold/10 text-gold",
  },
  fine: {
    icon: AlertCircle,
    color: "bg-destructive/10 text-destructive",
  },
};

interface RecentActivityFeedProps {
  items: ActivityItem[];
}

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-accent" />
            Recent activity
          </CardTitle>
          <CardDescription>
            Contributions, loans, and fines in one timeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Contributions, loans, and fines will appear in your timeline"
              compact
            />
          ) : (
            <div className="space-y-1">
              {items.map((item, index) => {
                const config = typeConfig[item.type];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        config.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.subtitle} ·{" "}
                        {formatDistanceToNow(item.date, { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums">
                        {item.amount.toLocaleString()} RWF
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
