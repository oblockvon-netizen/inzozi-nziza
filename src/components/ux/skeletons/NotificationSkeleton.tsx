import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/AppShell";

export function NotificationSkeleton() {
  return (
    <AppShell title="Notifications" subtitle="Loading...">
      <div
        className="mx-auto max-w-3xl space-y-6"
        role="status"
        aria-busy="true"
        aria-label="Loading notifications"
      >
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-16 rounded-md" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
