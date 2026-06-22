import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AdminSkeleton } from "@/components/ux/skeletons/AdminSkeleton";
import { ErrorState } from "@/components/ux/ErrorState";
import { AppShell } from "@/components/layout/AppShell";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { GlassPanel } from "@/components/ui/glass-panel";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AdminOpsHero } from "@/components/admin/AdminOpsHero";
import { AdminKpiGrid } from "@/components/admin/AdminKpiGrid";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { ApprovalCenter } from "@/components/admin/ApprovalCenter";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { ContributionsManagement } from "@/components/admin/ContributionsManagement";
import { LoansManagement } from "@/components/admin/LoansManagement";
import FinesManagement from "@/components/FinesManagement";
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
import {
  computeAdminKpis,
  buildContributionBars,
  buildPlatformGrowth,
  buildLoanStatusPie,
  buildApprovalQueue,
  buildAdminNotifications,
  matchesSearch,
} from "@/lib/admin-analytics";
import type { AdminUser, Contribution, Fine, Loan } from "@/types/api";
import { Shield, Calendar as CalendarIcon } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { format } from "date-fns";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const [searchUsers, setSearchUsers] = useState("");
  const [searchContributions, setSearchContributions] = useState("");
  const [searchLoans, setSearchLoans] = useState("");
  const [filterUsers, setFilterUsers] = useState("all");
  const [filterContributions, setFilterContributions] = useState("all");
  const [filterLoans, setFilterLoans] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedLoans, setSelectedLoans] = useState<Set<string>>(new Set());
  const [approvalSelectedUsers, setApprovalSelectedUsers] = useState<Set<string>>(new Set());

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showLoanDialog, setShowLoanDialog] = useState(false);
  const [showContributionDialog, setShowContributionDialog] = useState(false);
  const [contributionUser, setContributionUser] = useState<AdminUser | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionReference, setContributionReference] = useState("");
  const [contributionDate, setContributionDate] = useState<Date>(new Date());
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);
  const [paymentUserName, setPaymentUserName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const isAdmin = user?.accessRole === "ADMIN";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      loadAdminData();
    } else if (user && !isAdmin) {
      setLoading(false);
    }
  }, [user, isAdmin]);

  const loadAdminData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      setLoadError(null);
      const [usersRes, contributionsRes, loansRes, finesRes] = await Promise.all([
        adminApi.users(),
        contributionsApi.listAll(),
        loansApi.listAll(),
        finesApi.listAll(),
      ]);
      setUsers(usersRes.users);
      setContributions(contributionsRes.contributions);
      setLoans(loansRes.loans);
      setFines(finesRes.fines);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load data";
      setLoadError(message);
      toast({ title: "Error loading admin data", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  const analytics = useMemo(() => {
    const kpis = computeAdminKpis(users, contributions, loans, fines);
    return {
      kpis,
      contributionBars: buildContributionBars(contributions),
      growthArea: buildPlatformGrowth(contributions),
      loanPie: buildLoanStatusPie(loans),
      approvalQueue: buildApprovalQueue(users, loans),
      notifications: buildAdminNotifications(kpis, contributions, loans, fines),
    };
  }, [users, contributions, loans, fines]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterUsers === "pending" && u.isApproved) return false;
      if (filterUsers === "approved" && !u.isApproved) return false;
      return matchesSearch(searchUsers, u.fullName, u.email, u.phone);
    });
  }, [users, filterUsers, searchUsers]);

  const filteredContributions = useMemo(() => {
    return contributions.filter((c) => {
      const member = users.find((u) => u.userId === c.userId);
      if (filterContributions !== "all" && c.status.toLowerCase() !== filterContributions) {
        return false;
      }
      return matchesSearch(searchContributions, member?.fullName, c.referenceNumber);
    });
  }, [contributions, users, filterContributions, searchContributions]);

  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const member = users.find((u) => u.userId === l.userId);
      if (filterLoans !== "all" && l.status.toLowerCase() !== filterLoans) return false;
      return matchesSearch(searchLoans, member?.fullName, l.purpose, l.userName);
    });
  }, [loans, users, filterLoans, searchLoans]);

  const toggleSet = (set: Set<string>, id: string, updater: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updater(next);
  };

  const handleUserApproval = async (userId: string, approve: boolean) => {
    try {
      if (approve) await adminApi.approveUser(userId);
      else await adminApi.rejectUser(userId);
      toast({
        title: approve ? "User approved" : "User rejected",
        description: `Member has been ${approve ? "approved" : "rejected"}.`,
      });
      loadAdminData(true);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Update failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const bulkApproveUsers = async (ids: string[]) => {
    for (const id of ids) {
      await handleUserApproval(id, true);
    }
    setSelectedUsers(new Set());
    setApprovalSelectedUsers(new Set());
  };

  const bulkRejectUsers = async (ids: string[]) => {
    for (const id of ids) {
      await handleUserApproval(id, false);
    }
    setSelectedUsers(new Set());
  };

  const bulkApproveLoans = async () => {
    const pending = [...selectedLoans].filter((id) => {
      const loan = loans.find((l) => l.id === id);
      return loan && isStatus(loan.status, "PENDING");
    });
    for (const id of pending) {
      try {
        await loansApi.approve(id);
      } catch {
        /* continue batch */
      }
    }
    toast({ title: "Bulk approve complete", description: `${pending.length} loan(s) processed.` });
    setSelectedLoans(new Set());
    loadAdminData(true);
  };

  const bulkDenyLoans = async () => {
    const pending = [...selectedLoans].filter((id) => {
      const loan = loans.find((l) => l.id === id);
      return loan && isStatus(loan.status, "PENDING");
    });
    for (const id of pending) {
      try {
        await loansApi.deny(id);
      } catch {
        /* continue batch */
      }
    }
    toast({ title: "Bulk deny complete", description: `${pending.length} loan(s) processed.` });
    setSelectedLoans(new Set());
    loadAdminData(true);
  };

  const handleLoanDecision = async (approved: boolean) => {
    if (!selectedLoan) return;
    try {
      if (approved) await loansApi.approve(selectedLoan.id, adminNotes || undefined);
      else await loansApi.deny(selectedLoan.id, adminNotes || undefined);
      toast({
        title: approved ? "Loan approved" : "Loan denied",
        description: "Application updated successfully.",
      });
      loadAdminData(true);
      setShowLoanDialog(false);
      setSelectedLoan(null);
      setAdminNotes("");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Update failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleAddContribution = async () => {
    if (!contributionUser) return;
    try {
      const amount = parseFloat(contributionAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Enter a valid amount");

      await contributionsApi.record({
        userId: contributionUser.userId,
        amount,
        referenceNumber: contributionReference || undefined,
        paymentDate: contributionDate.toISOString(),
      });

      toast({
        title: "Contribution recorded",
        description: `${amount.toLocaleString()} RWF for ${contributionUser.fullName}`,
      });
      loadAdminData(true);
      setShowContributionDialog(false);
      setContributionAmount("");
      setContributionReference("");
      setContributionUser(null);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to add contribution";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handlePaymentUpdate = async () => {
    if (!paymentLoan) return;
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Enter a valid amount");
      const total = toNumber(paymentLoan.totalWithInterest) || toNumber(paymentLoan.amount) * 1.05;
      const paid = toNumber(paymentLoan.amountPaid);
      if (amount > total - paid) throw new Error("Amount exceeds remaining balance");

      await loansApi.recordPayment(paymentLoan.id, { amount });
      toast({ title: "Payment recorded", description: `${amount.toLocaleString()} RWF recorded.` });
      loadAdminData(true);
      setShowPaymentDialog(false);
      setPaymentLoan(null);
      setPaymentAmount("");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Payment failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const generatePDF = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { height } = page.getSize();
      const font = await pdfDoc.embedFont("Helvetica");
      const { kpis } = analytics;

      page.drawText("Inzozi Nziza — Operations Report", {
        x: 50,
        y: height - 50,
        size: 18,
        font,
      });
      page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
        x: 50,
        y: height - 75,
        size: 11,
        font,
      });

      const lines = [
        `Total members: ${kpis.totalMembers}`,
        `Pending approvals: ${kpis.pendingApprovals}`,
        `Active loans: ${kpis.activeLoans}`,
        `Total contributions: ${kpis.totalContributions.toLocaleString()} RWF`,
        `Outstanding debt: ${kpis.outstandingDebt.toLocaleString()} RWF`,
      ];

      let y = height - 110;
      lines.forEach((line) => {
        page.drawText(line, { x: 50, y, size: 11, font });
        y -= 18;
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inzozi-ops-report-${new Date().toISOString().split("T")[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not generate PDF",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth/login", { replace: true });
    } catch (error) {
      toast({ title: "Sign out failed", variant: "destructive" });
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Loading operations center..." />;
  }

  if (isAdmin && loading && !loadError) {
    return <AdminSkeleton />;
  }

  if (!user) return null;

  const hasAdminData = users.length > 0 || contributions.length > 0;

  if (isAdmin && loadError && !hasAdminData) {
    return (
      <AppShell title="Operations" subtitle={user.fullName} variant="admin" onSignOut={handleSignOut}>
        <ErrorState message={loadError} onRetry={() => loadAdminData()} />
      </AppShell>
    );
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
              You don&apos;t have admin privileges.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="mt-6 w-full">
              Go to dashboard
            </Button>
          </GlassPanel>
        </div>
      </MarketingLayout>
    );
  }

  const pendingTotal =
    analytics.kpis.pendingApprovals +
    loans.filter((l) => isStatus(l.status, "PENDING")).length;

  return (
    <AppShell
      title="Operations center"
      subtitle="Group operations — your personal dashboard is under My dashboard"
      variant="admin"
      onSignOut={handleSignOut}
    >
      <div className="space-y-6">
        {loadError && (
          <ErrorState
            message={loadError}
            onRetry={() => loadAdminData()}
            compact
            className="mb-2"
          />
        )}
        <AdminOpsHero
          pendingCount={pendingTotal}
          onRefresh={() => loadAdminData(true)}
          onExport={generatePDF}
          refreshing={refreshing}
        />

        <AdminKpiGrid kpis={analytics.kpis} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ApprovalCenter
              items={analytics.approvalQueue}
              onApproveUser={(id) => handleUserApproval(id, true)}
              onRejectUser={(id) => handleUserApproval(id, false)}
              onReviewLoan={(id) => {
                const loan = loans.find((l) => l.id === id);
                if (loan) {
                  setSelectedLoan(loan);
                  setAdminNotes(loan.adminNotes ?? "");
                  setShowLoanDialog(true);
                }
              }}
              onBulkApproveUsers={() => bulkApproveUsers([...approvalSelectedUsers])}
              selectedUserIds={approvalSelectedUsers}
              onToggleUser={(id) =>
                toggleSet(approvalSelectedUsers, id, setApprovalSelectedUsers)
              }
            />
          </div>
          <AdminNotifications notifications={analytics.notifications} />
        </div>

        <AdminAnalytics
          contributionBars={analytics.contributionBars}
          growthArea={analytics.growthArea}
          loanPie={analytics.loanPie}
        />

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="fines">Fines</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersManagement
              users={filteredUsers}
              search={searchUsers}
              onSearchChange={setSearchUsers}
              filter={filterUsers}
              onFilterChange={setFilterUsers}
              selected={selectedUsers}
              onToggle={(id) => toggleSet(selectedUsers, id, setSelectedUsers)}
              onToggleAll={(ids) => setSelectedUsers(new Set(ids))}
              onApprove={(id) => handleUserApproval(id, true)}
              onAddContribution={(u) => {
                setContributionUser(u);
                setShowContributionDialog(true);
              }}
              onBulkApprove={() => bulkApproveUsers([...selectedUsers])}
              onBulkReject={() => bulkRejectUsers([...selectedUsers])}
            />
          </TabsContent>

          <TabsContent value="contributions">
            <ContributionsManagement
              contributions={filteredContributions}
              users={users}
              search={searchContributions}
              onSearchChange={setSearchContributions}
              filter={filterContributions}
              onFilterChange={setFilterContributions}
            />
          </TabsContent>

          <TabsContent value="loans">
            <LoansManagement
              loans={filteredLoans}
              users={users}
              search={searchLoans}
              onSearchChange={setSearchLoans}
              filter={filterLoans}
              onFilterChange={setFilterLoans}
              selected={selectedLoans}
              onToggle={(id) => toggleSet(selectedLoans, id, setSelectedLoans)}
              onToggleAll={(ids) => setSelectedLoans(new Set(ids))}
              onReview={(loan) => {
                setSelectedLoan(loan);
                setAdminNotes(loan.adminNotes ?? "");
                setShowLoanDialog(true);
              }}
              onRecordPayment={(loan, name) => {
                setPaymentLoan(loan);
                setPaymentUserName(name);
                setShowPaymentDialog(true);
              }}
              onBulkApprove={bulkApproveLoans}
              onBulkDeny={bulkDenyLoans}
            />
          </TabsContent>

          <TabsContent value="fines">
            <FinesManagement
              users={users.map((u) => ({ user_id: u.userId, full_name: u.fullName }))}
              onUpdate={() => loadAdminData(true)}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <AdminNotifications notifications={analytics.notifications} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showContributionDialog} onOpenChange={setShowContributionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record contribution</DialogTitle>
            <DialogDescription>
              Add a payment for {contributionUser?.fullName}
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
              />
            </div>
            <div className="space-y-2">
              <Label>Payment date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(contributionDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={contributionDate}
                    onSelect={(d) => d && setContributionDate(d)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref">Reference</Label>
              <Input
                id="ref"
                value={contributionReference}
                onChange={(e) => setContributionReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContributionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddContribution} className="bg-accent hover:bg-accent/90">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review loan application</DialogTitle>
            <DialogDescription>
              {selectedLoan &&
                `${toNumber(selectedLoan.amount).toLocaleString()} RWF — ${selectedLoan.purpose}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Admin notes</Label>
              <Textarea
                id="notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
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
            <Button onClick={() => handleLoanDecision(true)} className="bg-accent hover:bg-accent/90">
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record loan payment</DialogTitle>
            <DialogDescription>Payment for {paymentUserName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {paymentLoan && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Remaining</span>
                  <span className="tabular-nums font-medium">
                    {(
                      (toNumber(paymentLoan.totalWithInterest) ||
                        toNumber(paymentLoan.amount) * 1.05) -
                      toNumber(paymentLoan.amountPaid)
                    ).toLocaleString()}{" "}
                    RWF
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="pay-amt">Amount (RWF)</Label>
              <Input
                id="pay-amt"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaymentUpdate}>Record payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default AdminDashboard;
