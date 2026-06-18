import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  adminApi,
  contributionsApi,
  loansApi,
  finesApi,
  toNumber,
  isStatus,
  ApiError,
} from "@/lib/api";
import type { Fine as ApiFine } from "@/types/api";
import {
  Users,
  DollarSign,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  FileText,
  Plus,
} from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import FinesManagement from "@/components/FinesManagement";

interface UserWithProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  is_approved: boolean;
  total_contributions: number;
  pending_contributions: number;
  loan_count: number;
}

interface Contribution {
  id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  status: string;
  reference_number: string | null;
}

interface Loan {
  id: string;
  user_id: string;
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
  installments_count: number;
}

interface ContributionDialogData {
  userId: string;
  userName: string;
  amount: number;
  paymentDate: Date;
}

interface LoanDialogData {
  id: string;
  user_id: string;
  userName: string;
  amount: number;
  purpose: string;
  status: string;
  adminNotes: string | null;
}

interface PaymentDialogData {
  loanId: string;
  userName: string;
  amount: number;
  paidAmount: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fines, setFines] = useState<ApiFine[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanDialogData | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [showContributionDialog, setShowContributionDialog] = useState(false);
  const [contributionData, setContributionData] = useState<ContributionDialogData | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionReference, setContributionReference] = useState("");
  const [contributionDate, setContributionDate] = useState<Date>(new Date());
  const [showLoanDialog, setShowLoanDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentDialogData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const isAdmin = user?.accessRole === "ADMIN";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      loadAdminData();
    } else if (user && !isAdmin) {
      setLoading(false);
    }
  }, [user, isAdmin]);

  const loadAdminData = async () => {
    try {
      const [usersRes, contributionsRes, loansRes, finesRes] = await Promise.all([
        adminApi.users(),
        contributionsApi.listAll(),
        loansApi.listAll(),
        finesApi.listAll(),
      ]);

      const mappedLoans: Loan[] = loansRes.loans.map((loan) => ({
        id: loan.id,
        user_id: loan.userId,
        amount: toNumber(loan.amount),
        purpose: loan.purpose,
        status: loan.status,
        applied_at: loan.appliedAt,
        approved_at: loan.approvedAt ?? null,
        admin_notes: loan.adminNotes ?? null,
        due_date: loan.dueDate ?? null,
        interest_rate: loan.interestRate ?? 0.05,
        total_with_interest:
          toNumber(loan.totalWithInterest) || toNumber(loan.amount) * 1.05,
        amount_paid: toNumber(loan.amountPaid),
        last_payment_date: loan.lastPaymentDate ?? null,
        installments_count: loan.installmentsCount ?? 3,
      }));

      const mappedContributions: Contribution[] = contributionsRes.contributions.map(
        (c) => ({
          id: c.id,
          user_id: c.userId,
          amount: toNumber(c.amount),
          payment_date: c.paymentDate,
          status: c.status,
          reference_number: c.referenceNumber ?? null,
        })
      );

      const mappedUsers: UserWithProfile[] = usersRes.users.map((u) => ({
        id: u.id,
        user_id: u.userId,
        full_name: u.fullName,
        phone: u.phone,
        is_approved: u.isApproved,
        total_contributions: u.totalContributions,
        pending_contributions: u.pendingContributions,
        loan_count: u.loanCount,
      }));

      setUsers(mappedUsers);
      setContributions(mappedContributions);
      setLoans(mappedLoans);
      setFines(finesRes.fines);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load data";
      toast({ title: "Error loading admin data", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUserApproval = async (userId: string, approve: boolean) => {
    try {
      if (approve) {
        await adminApi.approveUser(userId);
      } else {
        await adminApi.rejectUser(userId);
      }

      setUsers(
        users.map((u) =>
          u.user_id === userId ? { ...u, is_approved: approve } : u
        )
      );

      toast({
        title: approve ? "User approved" : "User rejected",
        description: `User has been ${approve ? "approved" : "rejected"} successfully.`,
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Update failed";
      toast({ title: "Error updating user status", description: message, variant: "destructive" });
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

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed" || s === "approved") {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    if (s === "pending") {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
    if (s === "failed" || s === "denied") {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    const s = status.toLowerCase();
    if (s === "completed" || s === "approved") return "default";
    if (s === "pending") return "secondary";
    if (s === "failed" || s === "denied") return "destructive";
    return "outline";
  };

  const handleAddContribution = async () => {
    if (!contributionData) return;

    try {
      const amount = parseFloat(contributionAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      await contributionsApi.record({
        userId: contributionData.userId,
        amount,
        referenceNumber: contributionReference || undefined,
        paymentDate: contributionDate.toISOString(),
      });

      toast({
        title: "Contribution added successfully",
        description: `Added ${amount.toLocaleString()} RWF for ${contributionData.userName}`,
      });

      loadAdminData();
      setShowContributionDialog(false);
      setContributionAmount("");
      setContributionReference("");
      setContributionDate(new Date());
      setContributionData(null);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to add contribution";
      toast({ title: "Error adding contribution", description: message, variant: "destructive" });
    }
  };

  const handleLoanDecision = async (approved: boolean) => {
    if (!selectedLoan) return;

    try {
      if (approved) {
        await loansApi.approve(selectedLoan.id, adminNotes || undefined);
        toast({
          title: "Loan approved",
          description: `${selectedLoan.userName}'s loan has been approved.`,
        });
      } else {
        await loansApi.deny(selectedLoan.id, adminNotes || undefined);
        toast({
          title: "Loan denied",
          description: `${selectedLoan.userName}'s loan application has been denied.`,
        });
      }

      loadAdminData();
      setShowLoanDialog(false);
      setSelectedLoan(null);
      setAdminNotes("");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Update failed";
      toast({ title: "Error updating loan status", description: message, variant: "destructive" });
    }
  };

  const generatePDF = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage();
      const { height } = page.getSize();
      const helveticaFont = await pdfDoc.embedFont("Helvetica");
      const fontSize = 12;

      page.drawText("Inzozi Nziza Community Hub - Report", {
        x: 50,
        y: height - 50,
        size: 20,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
        x: 50,
        y: height - 80,
        size: fontSize,
        font: helveticaFont,
      });

      const totalContributions = contributions
        .filter((c) => isStatus(c.status, "COMPLETED"))
        .reduce((sum, c) => sum + c.amount, 0);

      const totalLoans = loans
        .filter((l) => isStatus(l.status, "APPROVED"))
        .reduce((sum, l) => sum + l.amount, 0);

      let y = height - 120;
      const statistics = [
        `Total Users: ${users.length}`,
        `Pending Approvals: ${users.filter((u) => !u.is_approved).length}`,
        `Total Contributions: ${totalContributions.toLocaleString()} RWF`,
        `Total Loans: ${totalLoans.toLocaleString()} RWF`,
        `Pending Loans: ${loans.filter((l) => isStatus(l.status, "PENDING")).length}`,
      ];

      statistics.forEach((stat) => {
        page.drawText(stat, { x: 50, y, size: fontSize, font: helveticaFont });
        y -= 20;
      });

      y -= 40;
      page.drawText("User List:", { x: 50, y, size: 16, font: helveticaFont });

      y -= 30;
      users.forEach((u) => {
        if (y < 50) {
          page = pdfDoc.addPage();
          y = height - 50;
        }
        page.drawText(
          `${u.full_name} - ${u.total_contributions.toLocaleString()} RWF`,
          { x: 50, y, size: fontSize, font: helveticaFont }
        );
        y -= 20;
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inzozi-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      const message = error instanceof Error ? error.message : "PDF failed";
      toast({ title: "Error generating PDF", description: message, variant: "destructive" });
    }
  };

  const handlePaymentUpdate = async () => {
    if (!paymentData) return;

    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const remainingAmount = paymentData.amount - paymentData.paidAmount;
      if (amount > remainingAmount) {
        throw new Error("Payment amount cannot exceed the remaining balance");
      }

      await loansApi.recordPayment(paymentData.loanId, { amount });

      toast({
        title: "Payment Updated",
        description: `Payment of ${amount.toLocaleString()} RWF has been recorded.`,
      });

      loadAdminData();
      setShowPaymentDialog(false);
      setPaymentData(null);
      setPaymentAmount("");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Payment failed";
      toast({ title: "Error updating payment", description: message, variant: "destructive" });
    }
  };

  const handleOpenPaymentDialog = (loan: Loan, userName: string) => {
    setPaymentData({
      loanId: loan.id,
      userName,
      amount: loan.total_with_interest || loan.amount,
      paidAmount: loan.amount_paid || 0,
    });
    setShowPaymentDialog(true);
  };

  if (authLoading || (isAdmin && loading)) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <MarketingLayout>
        <div className="flex min-h-screen items-center justify-center p-4">
          <GlassPanel className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Access denied</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You don't have admin privileges to access this page.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="mt-6 w-full">
              Go to dashboard
            </Button>
          </GlassPanel>
        </div>
      </MarketingLayout>
    );
  }

  const totalContributions = contributions
    .filter((c) => isStatus(c.status, "COMPLETED"))
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPendingContributions = contributions.filter((c) =>
    isStatus(c.status, "PENDING")
  ).length;

  const totalLoans = loans.reduce((sum, l) => sum + l.amount, 0);
  const pendingLoans = loans.filter((l) => isStatus(l.status, "PENDING")).length;

  const totalFinesAmount = fines.reduce((sum, fine) => sum + toNumber(fine.amount), 0);
  const unpaidFinesCount = fines.filter((fine) => isStatus(fine.status, "PENDING")).length;

  return (
    <AppShell
      title="Admin dashboard"
      subtitle="Inzozi Nziza management"
      variant="admin"
      onSignOut={handleSignOut}
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total users"
          value={users.length}
          subtitle={`${users.filter((u) => !u.is_approved).length} pending approval`}
          icon={Users}
          index={0}
          accent="navy"
        />
        <StatCard
          title="Total contributions"
          value={`${totalContributions.toLocaleString()} RWF`}
          subtitle={`${totalPendingContributions} pending`}
          icon={DollarSign}
          index={1}
          accent="emerald"
        />
        <StatCard
          title="Total loans"
          value={`${totalLoans.toLocaleString()} RWF`}
          subtitle={`${pendingLoans} pending approval`}
          icon={CreditCard}
          index={2}
          accent="gold"
        />
        <StatCard
          title="Total fines"
          value={`${totalFinesAmount.toLocaleString()} RWF`}
          subtitle={`${unpaidFinesCount} unpaid fines`}
          icon={AlertCircle}
          index={3}
        />
      </div>

      <Tabs defaultValue="users" className="mt-8 space-y-6">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <SectionHeader
            title="Users"
            description="Manage member accounts and approvals"
            action={
              <Button onClick={generatePDF} variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Export report
              </Button>
            }
          />

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Contributions</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Loans</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{u.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {u.phone || "No phone"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.is_approved ? "default" : "secondary"}>
                            {u.is_approved ? "Approved" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.total_contributions.toLocaleString()} RWF</TableCell>
                        <TableCell>{u.pending_contributions}</TableCell>
                        <TableCell>{u.loan_count}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setContributionData({
                                  userId: u.user_id,
                                  userName: u.full_name,
                                  amount: 0,
                                  paymentDate: new Date(),
                                });
                                setShowContributionDialog(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Contribution
                            </Button>
                            {!u.is_approved && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleUserApproval(u.user_id, true)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contributions" className="space-y-4">
          <SectionHeader
            title="Contributions"
            description="Track member monthly payments"
            action={
              <Button onClick={generatePDF} variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Export report
              </Button>
            }
          />

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributions.map((contribution) => {
                      const member = users.find((u) => u.user_id === contribution.user_id);
                      return (
                        <TableRow key={contribution.id}>
                          <TableCell>
                            <p className="font-medium">{member?.full_name || "Unknown"}</p>
                          </TableCell>
                          <TableCell>{contribution.amount.toLocaleString()} RWF</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(contribution.status)}
                              <Badge variant={getStatusVariant(contribution.status)}>
                                {contribution.status.toLowerCase()}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(contribution.payment_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {contribution.reference_number || "N/A"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          <SectionHeader
            title="Loan applications"
            description="Review and manage member loan requests"
            action={
              <Button onClick={generatePDF} variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Export report
              </Button>
            }
          />

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan) => {
                      const member = users.find((u) => u.user_id === loan.user_id);
                      const totalDue = loan.total_with_interest || loan.amount;
                      const isFullyPaid = loan.amount_paid >= totalDue;

                      return (
                        <TableRow key={loan.id}>
                          <TableCell>{member?.full_name || "Unknown"}</TableCell>
                          <TableCell>{loan.amount.toLocaleString()} RWF</TableCell>
                          <TableCell className="max-w-[200px] truncate">{loan.purpose}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(loan.status)}>
                              {loan.status.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(loan.applied_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              {isStatus(loan.status, "PENDING") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedLoan({
                                      id: loan.id,
                                      user_id: loan.user_id,
                                      userName: member?.full_name || "Unknown",
                                      amount: loan.amount,
                                      purpose: loan.purpose,
                                      status: loan.status,
                                      adminNotes: loan.admin_notes,
                                    });
                                    setAdminNotes(loan.admin_notes || "");
                                    setShowLoanDialog(true);
                                  }}
                                >
                                  Review
                                </Button>
                              )}
                              {isStatus(loan.status, "APPROVED") && (
                                <div className="bg-muted p-3 rounded-md space-y-2">
                                  {isFullyPaid ? (
                                    <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/20 p-2 rounded-md">
                                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                        Loan Successfully Paid
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span>Progress</span>
                                          <span>
                                            {loan.amount_paid.toLocaleString()} /{" "}
                                            {totalDue.toLocaleString()} RWF
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span>Remaining Balance:</span>
                                          <span>
                                            {(totalDue - loan.amount_paid).toLocaleString()} RWF
                                          </span>
                                        </div>
                                        {loan.last_payment_date && (
                                          <p className="text-xs text-muted-foreground">
                                            Last payment:{" "}
                                            {new Date(loan.last_payment_date).toLocaleDateString()}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex justify-end mt-2">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleOpenPaymentDialog(
                                              loan,
                                              member?.full_name || "Unknown"
                                            )
                                          }
                                        >
                                          Record Payment
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fines" className="space-y-4">
          <FinesManagement
            users={users.map((u) => ({
              user_id: u.user_id,
              full_name: u.full_name,
            }))}
            onUpdate={loadAdminData}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={showContributionDialog} onOpenChange={setShowContributionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
            <DialogDescription>
              Add a new contribution for {contributionData?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (RWF)</Label>
              <Input
                id="amount"
                type="number"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                placeholder="Enter amount in RWF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(contributionDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={contributionDate}
                    onSelect={(date) => date && setContributionDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={contributionReference}
                onChange={(e) => setContributionReference(e.target.value)}
                placeholder="Enter payment reference"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContributionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddContribution}>Add Contribution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Loan Application</DialogTitle>
            <DialogDescription>
              Review and make a decision on {selectedLoan?.userName}'s loan application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Amount</Label>
              <p className="text-lg font-semibold">
                {selectedLoan?.amount.toLocaleString()} RWF
              </p>
            </div>
            <div>
              <Label>Purpose</Label>
              <p className="text-sm">{selectedLoan?.purpose}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about your decision (optional)"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoanDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleLoanDecision(false)}>
              Deny
            </Button>
            <Button onClick={() => handleLoanDecision(true)}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Loan Payment</DialogTitle>
            <DialogDescription>Record a payment for {paymentData?.userName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payment Details</Label>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Total Loan Amount:</span>
                  <span>{paymentData?.amount.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span>{paymentData?.paidAmount.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between font-medium bg-secondary/20 p-2 rounded-md">
                  <span>Remaining Balance:</span>
                  <span>
                    {paymentData
                      ? (paymentData.amount - paymentData.paidAmount).toLocaleString()
                      : 0}{" "}
                    RWF
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Payment Amount (RWF)</Label>
              <Input
                id="payment-amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter any amount to pay"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaymentUpdate}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default AdminDashboard;
