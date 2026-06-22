import { RefreshCw, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeroCard } from "@/components/layout/PageHeroCard";

interface AdminOpsHeroProps {
  pendingCount: number;
  onRefresh: () => void;
  onExport: () => void;
  refreshing?: boolean;
}

export function AdminOpsHero({
  pendingCount,
  onRefresh,
  onExport,
  refreshing,
}: AdminOpsHeroProps) {
  return (
    <PageHeroCard
      badge={
        <Badge className="mb-3 border-gold/30 bg-gold/10 text-gold hover:bg-gold/10">
          <Shield className="mr-1 h-3 w-3" />
          Operations center
        </Badge>
      }
      title="Community finance command center"
      description={
        <>
          Manage members, contributions, loans, and fines —{" "}
          {pendingCount > 0 ? (
            <span className="font-medium text-gold">
              {pendingCount} item{pendingCount !== 1 ? "s" : ""} need approval
            </span>
          ) : (
            "all queues clear"
          )}
        </>
      }
      actions={
        <>
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={onExport}
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <FileText className="h-4 w-4" />
            Export report
          </Button>
        </>
      }
    />
  );
}
