import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/AppShell";

export function AccountSkeleton() {
  return (
    <AppShell title="Profile" subtitle="Loading...">
      <div
        className="grid gap-8 lg:grid-cols-[280px_1fr]"
        role="status"
        aria-busy="true"
        aria-label="Loading account"
      >
        <div className="space-y-6">
          <Skeleton className="h-36 rounded-2xl" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="mt-6 h-64 rounded-xl" />
        </div>
      </div>
    </AppShell>
  );
}
