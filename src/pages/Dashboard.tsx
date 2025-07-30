import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
import ParticleBackground from "@/components/ParticleBackground";
import UserFines from "@/components/UserFines";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
} from "lucide-react";
import { User, Session } from "@supabase/supabase-js";
import { PDFDocument, rgb } from "pdf-lib";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  is_approved: boolean;
  created_at: string;
}

interface Contribution {
  id: string;
  amount: number;
  payment_date: string;
  status: string;
  reference_number: string | null;
}

interface Loan {
  id: string;
  amount: number;
  purpose: string;
  status: string;
  applied_at: string;
  approved_at: string | null;
  admin_notes: string | null;
  due_date: string | null;
  interest_rate: number;
  total_with_interest: number;
  amount_paid: number;
  last_payment_date: string | null;
  payment_schedule: LoanPayment[];
  installments_count: number;
}

interface LoanPayment {
  id: string;
  loan_id: string;
  amount: number;
  due_date: string;
  paid_amount: number;
  paid_date: string | null;
  status: "pending" | "paid" | "overdue";
}

interface LoanApplicationData {
  amount: string;
  purpose: string;
}

interface DbLoan {
  id: string;
  user_id: string;
  amount: number;
  purpose: string;
  status: string;
  applied_at: string;
  approved_at: string | null;
  admin_notes: string | null;
  due_date: string | null;
  interest_rate: number | null;
  total_with_interest: number | null;
  amount_paid: number | null;
  last_payment_date: string | null;
  installments_count: number | null;
  loan_payments: {
    id: string;
    loan_id: string;
    amount: number;
    due_date: string;
    paid_amount: number;
    paid_date: string | null;
    status: string;
    installment_number: number;
    notes: string | null;
  }[];
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoanDialog, setShowLoanDialog] = useState(false);
  const [loanData, setLoanData] = useState<LoanApplicationData>({
    amount: "",
    purpose: "",
  });
  const { toast } = useToast();

  const REQUIRED_CONTRIBUTION = 105000; // 105,000 RWF

  const getCurrentMonthContributions = (contributions: Contribution[]) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return contributions
      .filter(
        (c) =>
          c.status === "completed" && new Date(c.payment_date) >= startOfMonth
      )
      .reduce((sum, c) => sum + c.amount, 0);
  };

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session) {
        window.location.href = "/auth";
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session) {
        window.location.href = "/auth";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        // If profile doesn't exist, create one
        if (profileError.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              user_id: user.id,
              full_name:
                user.user_metadata.full_name ||
                user.email?.split("@")[0] ||
                "User",
              is_approved: false,
            })
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
        } else {
          throw profileError;
        }
      } else {
        setProfile(profileData);
      }

      // Load contributions
      const { data: contributionsData, error: contributionsError } =
        await supabase
          .from("contributions")
          .select("*")
          .eq("user_id", user.id)
          .order("payment_date", { ascending: false });

      if (contributionsError) throw contributionsError;
      setContributions(contributionsData || []);

      // Load loans with type assertion
      const { data: loansData, error: loansError } = (await supabase
        .from("loans")
        .select(
          `
          *,
          loan_payments (
            id,
            loan_id,
            amount,
            due_date,
            paid_amount,
            paid_date,
            status,
            installment_number,
            notes
          )
        `
        )
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false })) as {
        data: DbLoan[] | null;
        error: any;
      };

      if (loansError) throw loansError;

      // Transform the data to ensure all fields are present
      const transformedLoans = (loansData || []).map((loan: DbLoan) => ({
        id: loan.id,
        user_id: loan.user_id,
        amount: loan.amount,
        purpose: loan.purpose,
        status: loan.status,
        applied_at: loan.applied_at,
        approved_at: loan.approved_at,
        admin_notes: loan.admin_notes,
        due_date: loan.due_date,
        interest_rate: loan.interest_rate || 0.05,
        total_with_interest: loan.total_with_interest || loan.amount * 1.05,
        amount_paid: loan.amount_paid || 0,
        last_payment_date: loan.last_payment_date,
        payment_schedule: (loan.loan_payments || []).map((payment) => ({
          id: payment.id,
          loan_id: payment.loan_id,
          amount: payment.amount,
          due_date: payment.due_date,
          paid_amount: payment.paid_amount || 0,
          paid_date: payment.paid_date,
          status: payment.status as "pending" | "paid" | "overdue",
        })),
        installments_count: loan.installments_count || 3,
      })) as Loan[];

      setLoans(transformedLoans);
    } catch (error: unknown) {
      const e = error as Error;
      toast({
        title: "Error loading data",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/auth";
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
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

      const { error } = await supabase.from("loans").insert({
        user_id: user!.id,
        amount: amount,
        purpose: loanData.purpose.trim(),
        status: "pending",
        applied_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Loan application submitted",
        description: "Your application will be reviewed by an admin.",
      });

      // Reload data
      loadUserData();
      setShowLoanDialog(false);
      setLoanData({ amount: "", purpose: "" });
    } catch (error: any) {
      toast({
        title: "Error submitting loan application",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = async () => {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const helveticaFont = await pdfDoc.embedFont("Helvetica");
      const fontSize = 12;
      const lineHeight = 20;

      // Add title
      page.drawText("Inzozi Nziza Community Hub - Member Report", {
        x: 50,
        y: height - 50,
        size: 20,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      // Add member info
      let currentY = height - 100;
      page.drawText(`Member: ${profile?.full_name}`, {
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

      // Add contribution summary
      currentY -= lineHeight * 2;
      page.drawText("Contribution Summary", {
        x: 50,
        y: currentY,
        size: 16,
        font: helveticaFont,
      });

      currentY -= lineHeight;
      const completedContributions = contributions.filter(
        (c) => c.status === "completed"
      );
      const totalContributed = completedContributions.reduce(
        (sum, c) => sum + c.amount,
        0
      );

      page.drawText(
        `Total Contributions: ${totalContributed.toLocaleString()} RWF`,
        {
          x: 50,
          y: currentY,
          size: fontSize,
          font: helveticaFont,
        }
      );

      currentY -= lineHeight;
      page.drawText(
        `Progress: ${Math.min(
          (totalContributed / REQUIRED_CONTRIBUTION) * 100,
          100
        ).toFixed(1)}%`,
        {
          x: 50,
          y: currentY,
          size: fontSize,
          font: helveticaFont,
        }
      );

      // Add contribution details
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
          // Add new page if we're running out of space
          page = pdfDoc.addPage();
          currentY = height - 50;
        }

        page.drawText(
          `${new Date(
            contribution.payment_date
          ).toLocaleDateString()} - ${contribution.amount.toLocaleString()} RWF (${
            contribution.status
          })`,
          {
            x: 50,
            y: currentY,
            size: fontSize,
            font: helveticaFont,
          }
        );
        currentY -= lineHeight;
      });

      // Add loan summary
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
          // Add new page if we're running out of space
          page = pdfDoc.addPage();
          currentY = height - 50;
        }

        page.drawText(
          `${new Date(
            loan.applied_at
          ).toLocaleDateString()} - ${loan.amount.toLocaleString()} RWF (${
            loan.status
          })`,
          {
            x: 50,
            y: currentY,
            size: fontSize,
            font: helveticaFont,
          }
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

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      const buffer = new Uint8Array(pdfBytes).buffer;

      // Create a download link
      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inzozi-member-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "Your member report has been downloaded.",
      });
    } catch (error: unknown) {
      const e = error as Error;
      toast({
        title: "Error generating report",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const totalContributions = getCurrentMonthContributions(contributions);

  const contributionProgress = Math.min(
    (totalContributions / REQUIRED_CONTRIBUTION) * 100,
    100
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
      case "denied":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "completed":
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
      case "denied":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (!profile?.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        <ParticleBackground />
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md relative z-10 animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center animate-pulse">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle>Pending Approval</CardTitle>
            <CardDescription>
              Your account is waiting for admin approval. You'll receive an
              email once your account is activated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-primary">Inzozi Nziza</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {profile?.full_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid gap-6 lg:grid-cols-12 animate-fade-in">
          {/* Contribution Status */}
          <Card className="lg:col-span-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Contribution Status
              </CardTitle>
              <CardDescription>
                Required: {REQUIRED_CONTRIBUTION.toLocaleString()} RWF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contributionProgress >= 100 ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-800">
                        Monthly Contribution Complete!
                      </p>
                      <p className="text-green-700">
                        You've met your contribution requirement for{" "}
                        {new Date().toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                        . The next contribution period starts on{" "}
                        {new Date(
                          new Date().getFullYear(),
                          new Date().getMonth() + 1,
                          1
                        ).toLocaleDateString()}
                        .
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>
                      {totalContributions.toLocaleString()} /{" "}
                      {REQUIRED_CONTRIBUTION.toLocaleString()} RWF
                    </span>
                  </div>
                  <Progress value={contributionProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {(
                      REQUIRED_CONTRIBUTION - totalContributions
                    ).toLocaleString()}{" "}
                    RWF remaining
                  </p>
                </div>
              )}

              {contributionProgress < 100 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">
                        Action Required
                      </p>
                      <p className="text-yellow-700">
                        Complete your contribution for{" "}
                        {new Date().toLocaleString("default", {
                          month: "long",
                        })}{" "}
                        to maintain active membership.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold">{contributions.length}</p>
                <p className="text-xs text-muted-foreground">Total Payments</p>
              </div>
              <Separator />
              <div>
                <p className="text-2xl font-bold">{loans.length}</p>
                <p className="text-xs text-muted-foreground">
                  Loan Applications
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-2xl font-bold">
                  {loans.filter((l) => l.status === "approved").length}
                </p>
                <p className="text-xs text-muted-foreground">Approved Loans</p>
              </div>
              <div className="pt-4 flex gap-2">
                <Button
                  onClick={() => setShowLoanDialog(true)}
                  className="w-full"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Apply for Loan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your recent contributions and loans
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={handleDownloadReport}
                className="hidden sm:flex"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Recent Contributions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Recent Contributions
                  </h3>
                  {contributions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No contributions yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {contributions.slice(0, 5).map((contribution) => (
                        <div
                          key={contribution.id}
                          className="flex items-center justify-between border-b pb-2 last:border-0"
                        >
                          <div>
                            <p className="font-medium">
                              {contribution.amount.toLocaleString()} RWF
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(
                                contribution.payment_date
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={getStatusVariant(contribution.status)}
                          >
                            {contribution.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Recent Fines */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Fines</h3>
                  {user && <UserFines userId={user.id} />}
                </div>

                <Separator />

                {/* Recent Loans */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Loans</h3>
                  {loans.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No loan applications yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {loans.slice(0, 5).map((loan) => (
                        <div
                          key={loan.id}
                          className="flex items-center justify-between border-b pb-2 last:border-0"
                        >
                          <div>
                            <p className="font-medium">
                              {loan.amount.toLocaleString()} RWF
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {loan.purpose}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Applied:{" "}
                              {new Date(loan.applied_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={getStatusVariant(loan.status)}>
                            {loan.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Loans */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Active Loans
              </CardTitle>
              <CardDescription>Your current loan status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loans
                .filter((loan) => loan.status === "approved")
                .map((loan) => (
                  <div key={loan.id} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Loan</span>
                        <span>
                          {loan.total_with_interest.toLocaleString()} RWF
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Amount Paid</span>
                        <span>{loan.amount_paid.toLocaleString()} RWF</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium bg-secondary/20 p-2 rounded-md">
                        <span>Remaining Balance</span>
                        <span>
                          {(
                            loan.total_with_interest - loan.amount_paid
                          ).toLocaleString()}{" "}
                          RWF
                        </span>
                      </div>
                      {loan.last_payment_date && (
                        <p className="text-xs text-muted-foreground">
                          Last payment:{" "}
                          {new Date(
                            loan.last_payment_date
                          ).toLocaleDateString()}
                        </p>
                      )}
                      <Progress
                        value={
                          (loan.amount_paid / loan.total_with_interest) * 100
                        }
                        className="mt-2"
                      />
                    </div>
                    <Separator />
                  </div>
                ))}
              {loans.filter((loan) => loan.status === "approved").length ===
                0 && (
                <div className="text-center text-sm text-muted-foreground">
                  No active loans
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Loan Application Dialog */}
      <Dialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Loan</DialogTitle>
            <DialogDescription>
              Please provide the loan details. Your application will be reviewed
              by an admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (RWF)</Label>
              <Input
                id="amount"
                type="number"
                value={loanData.amount}
                onChange={(e) =>
                  setLoanData({ ...loanData, amount: e.target.value })
                }
                placeholder="Enter amount in RWF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Loan Purpose</Label>
              <Textarea
                id="purpose"
                value={loanData.purpose}
                onChange={(e) =>
                  setLoanData({ ...loanData, purpose: e.target.value })
                }
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

      {/* Remove Payment Dialog */}
    </div>
  );
};

export default Dashboard;
