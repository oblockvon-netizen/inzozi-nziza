import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/LoadingSpinner";
import { DashboardSkeleton } from "@/components/ux/skeletons/DashboardSkeleton";
import { ErrorState } from "@/components/ux/ErrorState";
import { AppShell } from "@/components/layout/AppShell";
import { GlassPanel } from "@/components/ui/glass-panel";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { WelcomeHero } from "@/components/dashboard/user/WelcomeHero";
import { DashboardKpiGrid } from "@/components/dashboard/user/DashboardKpiGrid";
import { ContributionProgressSection } from "@/components/dashboard/user/ContributionProgressSection";
import { LoanOverviewSection } from "@/components/dashboard/user/LoanOverviewSection";
import { DashboardCharts } from "@/components/dashboard/user/DashboardCharts";
import { RecentActivityFeed } from "@/components/dashboard/user/RecentActivityFeed";
import { NotificationsPanel } from "@/components/dashboard/user/NotificationsPanel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  contributionsApi,
  loansApi,
  finesApi,
  toNumber,
  isStatus,
  ApiError,
} from "@/lib/api";
import {
  buildActivityFeed,
  buildContributionTrends,
  buildGrowthHistory,
  buildNotifications,
  buildRepaymentChart,
  sumCompletedContributions,
} from "@/lib/dashboard-analytics";
import type { Contribution, ContributionSummary, Fine, Loan } from "@/types/api";
import { Clock, LogOut } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";

interface LoanApplicationData {
  amount: string;
  purpose: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [summary, setSummary] = useState<ContributionSummary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showLoanDialog, setShowLoanDialog] = useState(false);
  const [loanData, setLoanData] = useState<LoanApplicationData>({
    amount: "",
    purpose: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoadError(null);
      const [contributionsRes, summaryRes, loansRes, finesRes] = await Promise.all([
        contributionsApi.mine(),
        contributionsApi.summary(),
        loansApi.mine(),
        finesApi.mine(),
      ]);
      setContributions(contributionsRes.contributions);
      setSummary(summaryRes.summary);
      setLoans(loansRes.loans);
      setFines(finesRes.fines);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load data";
      setLoadError(message);
      toast({ title: "Error loading data", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth/login", { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Sign out failed";
      toast({ title: "Error signing out", description: message, variant: "destructive" });
    }
  };

  const handleLoanApplication = async () => {
    try {
      const amount = parseFloat(loanData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }
      if (!loanData.purpose.trim()) {
        throw new Error("Please enter the loan purpose");
      }

      await loansApi.apply({ amount, purpose: loanData.purpose.trim() });

      toast({
        title: "Loan application submitted",
        description: "Your application will be reviewed by an admin.",
      });

      loadUserData();
      setShowLoanDialog(false);
      setLoanData({ amount: "", purpose: "" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Submission failed";
      toast({
        title: "Error submitting loan application",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = async () => {
    if (!user) return;

    try {
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage();
      const { height } = page.getSize();
      const helveticaFont = await pdfDoc.embedFont("Helvetica");
      const fontSize = 12;
      const lineHeight = 20;
      const required = summary?.requiredMonthlyContribution ?? 105000;

      page.drawText("Inzozi Nziza — Member Report", {
        x: 50,
        y: height - 50,
        size: 20,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      let currentY = height - 100;
      page.drawText(`Member: ${user.fullName}`, {
        x: 50,
        y: currentY,
        size: fontSize,
        font: helveticaFont,
      });

      currentY -= lineHeight;
      page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
        x: 50,
        y: currentY,
        size: fontSize,
        font: helveticaFont,
      });

      currentY -= lineHeight * 2;
      page.drawText("Contribution Summary", {
        x: 50,
        y: currentY,
        size: 16,
        font: helveticaFont,
      });

      currentY -= lineHeight;
      const totalContributed = summary?.totalThisMonth ?? 0;
      page.drawText(`Total This Month: ${totalContributed.toLocaleString()} RWF`, {
        x: 50,
        y: currentY,
        size: fontSize,
        font: helveticaFont,
      });

      currentY -= lineHeight;
      page.drawText(
        `Progress: ${Math.min((totalContributed / required) * 100, 100).toFixed(1)}%`,
        { x: 50, y: currentY, size: fontSize, font: helveticaFont }
      );

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inzozi-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report downloaded",
        description: "Your member report has been saved.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Report failed";
      toast({ title: "Error generating report", description: message, variant: "destructive" });
    }
  };

  const analytics = useMemo(() => {
    const totalContributed = sumCompletedContributions(contributions);
    const approvedLoans = loans.filter((l) => isStatus(l.status, "APPROVED"));
    const outstandingFines = fines
      .filter((f) => isStatus(f.status, "PENDING"))
      .reduce((sum, f) => {
        const rem =
          f.remaining != null
            ? toNumber(f.remaining)
            : toNumber(f.amount) - toNumber(f.amountPaid);
        return sum + rem;
      }, 0);

    return {
      totalContributed,
      approvedLoans: approvedLoans.length,
      outstandingFines,
      trends: buildContributionTrends(contributions),
      growth: buildGrowthHistory(contributions),
      repayment: buildRepaymentChart(loans),
      activity: buildActivityFeed(contributions, loans, fines),
      notifications: buildNotifications(summary, loans, fines),
    };
  }, [contributions, loans, fines, summary]);

  const requiredContribution = summary?.requiredMonthlyContribution ?? 105000;
  const totalContributions = summary?.totalThisMonth ?? 0;
  const contributionProgress = summary?.progressPercent ?? 0;
  const monthLabel = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  if (authLoading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (loading && !loadError) {
    return user ? (
      <DashboardSkeleton />
    ) : (
      <LoadingSpinner message="Loading your dashboard..." />
    );
  }

  if (!user) {
    return null;
  }

  const hasData =
    contributions.length > 0 || loans.length > 0 || summary !== null || fines.length > 0;

  if (loadError && !hasData) {
    return (
      <AppShell title="Analytics" subtitle={user.fullName} onSignOut={handleSignOut}>
        <ErrorState message={loadError} onRetry={loadUserData} />
      </AppShell>
    );
  }

  const isPending = user.accessRole === "PENDING_USER" || !user.isApproved;

  if (isPending) {
    return (
      <MarketingLayout>
        <div className="flex min-h-screen items-center justify-center p-4">
          <GlassPanel className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
              <Clock className="h-6 w-6 text-gold" />
            </div>
            <h2 className="text-xl font-semibold">Pending approval</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is waiting for admin approval. You&apos;ll receive an email
              once your account is activated.
            </p>
            <Button onClick={handleSignOut} variant="outline" className="mt-6 w-full gap-2">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </GlassPanel>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <AppShell title="Analytics" subtitle={user.fullName} onSignOut={handleSignOut}>
      {loadError && (
        <ErrorState
          message={loadError}
          onRetry={loadUserData}
          compact
          className="mb-6"
        />
      )}
      <div className="space-y-6">
        <WelcomeHero
          user={user}
          onApplyLoan={() => setShowLoanDialog(true)}
          onDownloadReport={handleDownloadReport}
        />

        <DashboardKpiGrid
          progressPercent={contributionProgress}
          totalContributed={analytics.totalContributed}
          activeLoans={analytics.approvedLoans}
          outstandingFines={analytics.outstandingFines}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ContributionProgressSection
              current={totalContributions}
              required={requiredContribution}
              progressPercent={contributionProgress}
              monthLabel={monthLabel}
            />
          </div>
          <div className="lg:col-span-1">
            <NotificationsPanel notifications={analytics.notifications} />
          </div>
        </div>

        <LoanOverviewSection
          loans={loans}
          onApplyLoan={() => setShowLoanDialog(true)}
        />

        <DashboardCharts
          trends={analytics.trends}
          repayment={analytics.repayment}
          growth={analytics.growth}
        />

        <RecentActivityFeed items={analytics.activity} />
      </div>

      <Dialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for loan</DialogTitle>
            <DialogDescription>
              Submit your application for admin review. Include a clear purpose.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (RWF)</Label>
              <Input
                id="amount"
                type="number"
                value={loanData.amount}
                onChange={(e) => setLoanData({ ...loanData, amount: e.target.value })}
                placeholder="e.g. 500000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Loan purpose</Label>
              <Textarea
                id="purpose"
                value={loanData.purpose}
                onChange={(e) => setLoanData({ ...loanData, purpose: e.target.value })}
                placeholder="Explain why you need this loan"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLoanApplication} className="bg-accent hover:bg-accent/90">
              Submit application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Dashboard;
