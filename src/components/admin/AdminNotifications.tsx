import { motion } from "framer-motion";
import { Bell, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminNotification } from "@/lib/admin-analytics";
import { cn } from "@/lib/utils";

const styles = {
  info: { icon: Info, border: "border-blue-500/20 bg-blue-500/5", color: "text-blue-500" },
  warning: { icon: AlertTriangle, border: "border-gold/30 bg-gold/5", color: "text-gold" },
  success: { icon: CheckCircle2, border: "border-accent/30 bg-accent/5", color: "text-accent" },
};

export function AdminNotifications({ notifications }: { notifications: AdminNotification[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
      <Card className="h-full border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-gold" />
            Notifications
          </CardTitle>
          <CardDescription>Operational alerts for your community</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((note, i) => {
              const s = styles[note.variant];
              const Icon = s.icon;
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className={cn("flex gap-3 rounded-xl border p-3", s.border)}
                >
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", s.color)} />
                  <div>
                    <p className="text-sm font-medium">{note.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{note.message}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
