import { CreditCard, Download, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeroCard } from "@/components/layout/PageHeroCard";
import { getGreeting } from "@/lib/dashboard-analytics";
import type { AuthUser } from "@/types/api";
import { userIsAdmin } from "@/lib/auth-roles";

interface WelcomeHeroProps {
  user: AuthUser;
  onApplyLoan: () => void;
  onDownloadReport: () => void;
}

export function WelcomeHero({
  user,
  onApplyLoan,
  onDownloadReport,
}: WelcomeHeroProps) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const isAdmin = userIsAdmin(user);

  return (
    <PageHeroCard
      badge={
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className="border-accent/30 bg-accent/10 text-accent hover:bg-accent/10">
            <Sparkles className="mr-1 h-3 w-3" />
            My member dashboard
          </Badge>
          {isAdmin && (
            <Badge variant="outline" className="border-gold/30 text-gold">
              <Shield className="mr-1 h-3 w-3" />
              Admin account
            </Badge>
          )}
          {user.emailVerified && (
            <Badge variant="outline">Verified</Badge>
          )}
        </div>
      }
      title={`${getGreeting()}, ${user.fullName.split(" ")[0]}`}
      description={
        <>
          {today} · Your personal contributions, loans, and activity
          {isAdmin && (
            <span className="mt-1 block text-xs">
              This is your own member account — use Operations in the menu for admin tools.
            </span>
          )}
        </>
      }
      actions={
        <>
          <Button
            onClick={onApplyLoan}
            className="gap-2 bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90"
          >
            <CreditCard className="h-4 w-4" />
            Apply for loan
          </Button>
          <Button variant="outline" onClick={onDownloadReport} className="gap-2">
            <Download className="h-4 w-4" />
            Download report
          </Button>
        </>
      }
    />
  );
}
