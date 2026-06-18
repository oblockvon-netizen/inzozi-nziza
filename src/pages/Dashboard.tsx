import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { AppShell } from "@/components/layout/AppShell";
import { ContributionProgress } from "@/components/dashboard/ContributionProgress";
import { StatCard } from "@/components/dashboard/StatCard";
import { AnimatedProgress } from "@/components/dashboard/AnimatedProgress";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import UserFines from "@/components/UserFines";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  contributionsApi,
  loansApi,
  toNumber,
  isStatus,
  ApiError,
} from "@/lib/api";
import type { Contribution, ContributionSummary, Loan } from "@/types/api";
import {
  LogOut,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
} from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [showLoanDialog, setShowLoanDialog] = useState(false);
  const [loanData, setLoanData] = useState<LoanApplicationData>({
    amount: "",
    purpose: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const [contributionsRes, summaryRes, loansRes] = await Promise.all([
        contributionsApi.mine(),
        contributionsApi.summary(),
        loansApi.mine(),
      ]);
      setContributions(contributionsRes.contributions);
      setSummary(summaryRes.summary);
      setLoans(loansRes.loans);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load data";
      toast({ title: "Error loading data", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth", { replace: true });
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

      page.drawText("Inzozi Nziza Community Hub - Member Report", {
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
      page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
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

      currentY -= lineHeight * 2;
      page.drawText("Recent Contributions", {
        x: 50,
        y: currentY,
        size: 16,
        font: helveticaFont,
      });

      currentY -= lineHeight;
      contributions.slice(0, 10).forEach((contribution) => {
        if (currentY < 50) {
          page = pdfDoc.addPage();
          currentY = height - 50;
        }
        page.drawText(
          `${new Date(contribution.paymentDate).toLocaleDateString()} - ${toNumber(contribution.amount).toLocaleString()} RWF (${contribution.status})`,
          { x: 50, y: currentY, size: fontSize, font: helveticaFont }
        );
        currentY -= lineHeight;
      });

      currentY -= lineHeight;
      page.drawText("Loan History", {
        x: 50,
        y: currentY,
        size: 16,
        font: helveticaFont,
      });

      currentY -= lineHeight;
      loans.forEach((loan) => {
        if (currentY < 50) {
          page = pdfDoc.addPage();
          currentY = height - 50;
        }
        page.drawText(
          `${new Date(loan.appliedAt).toLocaleDateString()} - ${toNumber(loan.amount).toLocaleString()} RWF (${loan.status})`,
          { x: 50, y: currentY, size: fontSize, font: helveticaFont }
        );
        if (loan.purpose) {
          currentY -= lineHeight;
          page.drawText(`Purpose: ${loan.purpose}`, {
            x: 70,
            y: currentY,
            size: fontSize - 2,
            font: helveticaFont,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        currentY -= lineHeight;
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inzozi-member-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "Your member report has been downloaded.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Report failed";
      toast({ title: "Error generating report", description: message, variant: "destructive" });
    }
  };

  const requiredContribution = summary?.requiredMonthlyContribution ?? 105000;
  const totalContributions = summary?.totalThisMonth ?? 0;
  const contributionProgress = summary?.progressPercent ?? 0;

  if (authLoading || loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (!user) {
    return null;
  }

  const isPending =
    user.accessRole === "PENDING_USER" || !user.isApproved;

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
              Your account is waiting for admin approval. You'll receive an email
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

  const approvedLoans = loans.filter((l) => isStatus(l.status, "APPROVED"));

  return (
    <AppShell
      title="Member dashboard"
      subtitle={`Welcome back, ${user.fullName}`}
      onSignOut={handleSignOut}
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-accent" />
              Contribution status
            </CardTitle>
            <CardDescription>
              Required: {requiredContribution.toLocaleString()} RWF per month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContributionProgress
              current={totalContributions}
              required={requiredContribution}
              progressPercent={contributionProgress}
              monthLabel={new Date().toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:col-span-4">
          <StatCard
            title="Total payments"
            value={contributions.length}
            icon={TrendingUp}
            index={0}
            accent="emerald"
          />
          <StatCard
            title="Loan applications"
            value={loans.length}
            icon={CreditCard}
            index={1}
            accent="navy"
          />
          <StatCard
            title="Approved loans"
            value={approvedLoans.length}
            icon={CheckCircle2}
            index={2}
            accent="gold"
          />
          <Button
            onClick={() => setShowLoanDialog(true)}
            className="w-full gap-2 bg-accent hover:bg-accent/90"
          >
            <CreditCard className="h-4 w-4" />
            Apply for loan
          </Button>
        </div>

        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Recent activity</CardTitle>
              <CardDescription>Your recent contributions and loans</CardDescription>
            </div>
            <Button variant="outline" onClick={handleDownloadReport} className="hidden sm:flex">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div>
                <SectionHeader title="Recent contributions" className="mb-4" />
                {contributions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No contributions yet</p>
                ) : (
                  <div className="space-y-4">
                    {contributions.slice(0, 5).map((contribution) => (
                      <div
                        key={contribution.id}
                        className="flex items-center justify-between border-b pb-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium">
                            {toNumber(contribution.amount).toLocaleString()} RWF
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(contribution.paymentDate).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusBadge status={contribution.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <SectionHeader title="Recent fines" className="mb-4" />
                <UserFines />
              </div>

              <Separator />

              <div>
                <SectionHeader title="Recent loans" className="mb-4" />
                {loans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No loan applications yet</p>
                ) : (
                  <div className="space-y-4">
                    {loans.slice(0, 5).map((loan) => (
                      <div
                        key={loan.id}
                        className="flex items-center justify-between border-b pb-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium">
                            {toNumber(loan.amount).toLocaleString()} RWF
                          </p>
                          <p className="text-sm text-muted-foreground">{loan.purpose}</p>
                          <p className="text-xs text-muted-foreground">
                            Applied: {new Date(loan.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusBadge status={loan.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Active Loans
            </CardTitle>
            <CardDescription>Your current loan status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {approvedLoans.map((loan) => {
              const totalWithInterest =
                toNumber(loan.totalWithInterest) || toNumber(loan.amount) * 1.05;
              const amountPaid = toNumber(loan.amountPaid);
              return (
                <div key={loan.id} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Loan</span>
                      <span>{totalWithInterest.toLocaleString()} RWF</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Amount Paid</span>
                      <span>{amountPaid.toLocaleString()} RWF</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium bg-secondary/20 p-2 rounded-md">
                      <span>Remaining Balance</span>
                      <span>{(totalWithInterest - amountPaid).toLocaleString()} RWF</span>
                    </div>
                    {loan.lastPaymentDate && (
                      <p className="text-xs text-muted-foreground">
                        Last payment:{" "}
                        {new Date(loan.lastPaymentDate).toLocaleDateString()}
                      </p>
                    )}
                    <AnimatedProgress
                      value={(amountPaid / totalWithInterest) * 100}
                      showLabel
                      className="mt-2"
                    />
                  </div>
                  <Separator />
                </div>
              );
            })}
            {approvedLoans.length === 0 && (
              <div className="text-center text-sm text-muted-foreground">No active loans</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Loan</DialogTitle>
            <DialogDescription>
              Please provide the loan details. Your application will be reviewed by an admin.
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
                placeholder="Enter amount in RWF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Loan Purpose</Label>
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
            <Button onClick={handleLoanApplication}>Submit Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Dashboard;
