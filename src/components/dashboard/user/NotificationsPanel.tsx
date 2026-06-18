import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { DashboardNotification } from "@/lib/dashboard-analytics";
import { cn } from "@/lib/utils";

const variantStyles = {
  info: {
    icon: Info,
    border: "border-blue-500/20 bg-blue-500/5",
    iconColor: "text-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-gold/30 bg-gold/5",
    iconColor: "text-gold",
  },
  success: {
    icon: CheckCircle2,
    border: "border-accent/30 bg-accent/5",
    iconColor: "text-accent",
  },
};

interface NotificationsPanelProps {
  notifications: DashboardNotification[];
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.4 }}
      className="h-full"
    >
      <Card className="h-full border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-gold" />
            Notifications
          </CardTitle>
          <CardDescription>
            {notifications.length} update{notifications.length !== 1 ? "s" : ""} for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="mb-2 h-8 w-8 text-accent/50" />
              <p className="text-sm text-muted-foreground">You&apos;re all caught up</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((note, index) => {
                const style = variantStyles[note.variant];
                const Icon = style.icon;
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className={cn(
                      "flex gap-3 rounded-xl border p-3",
                      style.border
                    )}
                  >
                    <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.iconColor)} />
                    <div>
                      <p className="text-sm font-medium">{note.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {note.message}
                      </p>
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
