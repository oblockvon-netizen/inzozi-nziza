import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/AppShell";

export function AdminSkeleton() {
  return (
    <AppShell title="Operations" subtitle="Loading..." variant="admin">
      <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading admin dashboard">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-6">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </AppShell>
  );
}
