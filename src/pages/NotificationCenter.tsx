import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationSkeleton } from "@/components/ux/skeletons/NotificationSkeleton";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  getNotificationPriority,
  priorityLabels,
  priorityStyles,
} from "@/lib/notification-utils";
import {
  loadNotificationPreferences,
  shouldShowNotificationType,
} from "@/lib/notification-preferences";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Filter = "all" | "unread" | "high" | "medium" | "low";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    notifications,
    loading,
    unreadCount,
    refreshNotifications,
    markRead,
    markAllRead,
    error,
  } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [user, refreshNotifications]);

  const filtered = useMemo(() => {
    const prefs = loadNotificationPreferences();
    return notifications
      .filter((n) => shouldShowNotificationType(n.type, prefs))
      .filter((n) => {
        if (filter === "unread") return !n.read;
        if (filter === "all") return true;
        return getNotificationPriority(n.type) === filter;
      });
  }, [notifications, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  if (authLoading || !user) {
    return <NotificationSkeleton />;
  }

  return (
    <AppShell
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
      onSignOut={signOut}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Notification filters">
            {filters.map((f) => (
              <Button
                key={f.value}
                size="sm"
                role="tab"
                aria-selected={filter === f.value}
                variant={filter === f.value ? "default" : "outline"}
                onClick={() => setFilter(f.value)}
                className={filter === f.value ? "bg-accent hover:bg-accent/90" : ""}
              >
                {f.label}
                {f.value === "unread" && unreadCount > 0 && (
                  <Badge className="ml-1.5 bg-white/20 px-1.5 text-xs">{unreadCount}</Badge>
                )}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh notifications"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={markAllRead} className="gap-1">
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {error && notifications.length === 0 && (
          <ErrorState message={error} onRetry={handleRefresh} compact />
        )}

        {loading && notifications.length === 0 && !error ? (
          <div className="space-y-2" role="status" aria-busy="true" aria-label="Loading notifications">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 && !error ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description={
              filter === "all"
                ? "You're all caught up — new updates will appear here"
                : `Nothing matching the "${filter}" filter`
            }
          />
        ) : (
          <ul className="space-y-2" aria-live="polite" aria-label="Notifications list">
            <AnimatePresence mode="popLayout">
              {filtered.map((n, i) => {
                const priority = getNotificationPriority(n.type);
                const styles = priorityStyles[priority];
                return (
                  <motion.li
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <button
                      type="button"
                      onClick={() => !n.read && markRead(n.id)}
                      aria-label={`${n.title}. ${n.read ? "Read" : "Unread"}. ${priorityLabels[priority]} priority.`}
                      className={cn(
                        "w-full rounded-xl border px-4 py-4 text-left transition-colors hover:bg-muted/40",
                        n.read ? "border-border/40 bg-card/50" : "border-accent/20 bg-accent/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", styles.dot)}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={cn("font-medium", !n.read && "text-foreground")}>
                              {n.title}
                            </p>
                            <Badge variant="outline" className={cn("text-xs", styles.badge)}>
                              {priorityLabels[priority]}
                            </Badge>
                            {!n.read && (
                              <Badge className="bg-accent/15 text-accent hover:bg-accent/15 text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                          <p className="mt-2 text-xs text-muted-foreground/70">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </AppShell>
  );
}
