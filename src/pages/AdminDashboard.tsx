import React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  LogOut,
  Users,
  DollarSign,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Eye,
  Shield,
  Download,
  FileText,
  Plus,
} from "lucide-react";
import { User, Session } from "@supabase/supabase-js";
import { PDFDocument, rgb } from "pdf-lib";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import FinesManagement from "@/components/FinesManagement";
import { PostgrestError } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  is_approved: boolean;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "user";
  created_at: string;
}

interface Contribution {
  id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  status: string;
  reference_number: string | null;
  created_at: string;
}

// Add interface for raw loan data from the database
interface RawLoanData {
  id: string;
  user_id: string;
  amount: number;
  purpose: string;
  status: string;
  applied_at: string;
  approved_at: string | null;
  admin_notes: string | null;
  due_date?: string | null;
  interest_rate?: number | null;
  total_with_interest?: number | null;
  amount_paid?: number | null;
  last_payment_date?: string | null;
  installments_count?: number | null;
  loan_payments?: {
    id: string;
    loan_id: string;
    amount: number;
    due_date: string;
    paid_amount: number;
    paid_date: string | null;
    status: "pending" | "paid" | "overdue";
  }[];
  created_at: string;
  updated_at: string;
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
  interest_rate: number | null;
  total_with_interest: number | null;
  amount_paid: number | null;
  last_payment_date: string | null;
  installments_count: number;
  loan_payments?: LoanPayment[];
}

interface LoanPayment {
  id?: string;
  loan_id: string;
  amount: number;
  due_date: string;
  paid_amount: number;
  paid_date: string | null;
  status: "pending" | "paid" | "overdue";
  installment_number: number;
  notes: string | null;
}

interface UserWithProfile extends Profile {
  total_contributions: number;
  pending_contributions: number;
  loan_count: number;
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

// Add new interface for payment dialog
interface PaymentDialogData {
  loanId: string;
  paymentId: string;
  userName: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  isNewPayment: boolean;
}

interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

// Update the loan payment type to match Supabase's schema
interface DbLoanPayment {
  id?: string;
  loan_id: string;
  amount: number;
  due_date: string;
  paid_amount: number;
  paid_date: string | null;
  status: string;
  installment_number: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

interface LoanPayment extends Omit<DbLoanPayment, "status"> {
  status: "pending" | "paid" | "overdue";
}

interface Fine {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
  paid_at: string | null;
}

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanDialogData | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [showContributionDialog, setShowContributionDialog] = useState(false);
  const [contributionData, setContributionData] =
    useState<ContributionDialogData | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionReference, setContributionReference] = useState("");
  const [contributionDate, setContributionDate] = useState<Date>(new Date());
  const [showLoanDialog, setShowLoanDialog] = useState(false);
  const [selectedLoanDialog, setSelectedLoanDialog] =
    useState<LoanDialogData | null>(null);
  const [selectedLoanPayments, setSelectedLoanPayments] = useState<
    LoanPayment[]
  >([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentDialogData | null>(
    null
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"full" | "installment">(
    "installment"
  );
  const [fines, setFines] = useState<Fine[]>([]);

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
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      const adminAccess = !!data;
      setIsAdmin(adminAccess);

      if (!adminAccess) {
        window.location.href = "/dashboard";
        return;
      }

      loadAdminData();
    } catch (error: unknown) {
      const e = error as ApiError;
      toast({
        title: "Error checking permissions",
        description: e.message,
        variant: "destructive",
      });
      window.location.href = "/dashboard";
    }
  };

  // Update the loadAdminData function to use proper types and queries
  const loadAdminData = async () => {
    try {
      // Load users with aggregated data
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Load all contributions
      const { data: contributionsData, error: contributionsError } =
        await supabase
          .from("contributions")
          .select("*")
          .order("payment_date", { ascending: false });

      if (contributionsError) throw contributionsError;

      // Load all loans with their payments
      const { data: loansData, error: loansError } = await supabase
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
        .order("applied_at", { ascending: false });

      if (loansError) throw loansError;

      // Load fines data
      const { data: finesData, error: finesError } = await supabase
        .from("fines")
        .select("*");

      if (finesError) throw finesError;
      setFines(finesData || []);

      // Transform and set the data
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
        payment_schedule: (loan.loan_payments || []).map(payment => ({
          id: payment.id,
          loan_id: payment.loan_id,
          amount: payment.amount,
          due_date: payment.due_date,
          paid_amount: payment.paid_amount || 0,
          paid_date: payment.paid_date,
          status: payment.status as "pending" | "paid" | "overdue",
          installment_number: payment.installment_number,
          notes: payment.notes
        })),
        installments_count: loan.installments_count || 3
      })) as Loan[];

      // Transform and combine the user data
      const usersWithStats = profilesData?.map((profile) => {
        const userContributions =
          contributionsData?.filter((c) => c.user_id === profile.user_id) || [];
        const userLoans =
          transformedLoans?.filter((l) => l.user_id === profile.user_id) || [];

        return {
          ...profile,
          total_contributions: userContributions
            .filter((c) => c.status === "completed")
            .reduce((sum, c) => sum + c.amount, 0),
          pending_contributions: userContributions.filter(
            (c) => c.status === "pending"
          ).length,
          loan_count: userLoans.length,
        };
      }) || [];

      setUsers(usersWithStats);
      setContributions(contributionsData || []);
      setLoans(transformedLoans);

    } catch (error: unknown) {
      const e = error as ApiError;
      toast({
        title: "Error loading admin data",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserApproval = async (userId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: approve })
        .eq("user_id", userId);

      if (error) throw error;

      setUsers(
        users.map((user) =>
          user.user_id === userId ? { ...user, is_approved: approve } : user
        )
      );

      toast({
        title: approve ? "User approved" : "User rejected",
        description: `User has been ${
          approve ? "approved" : "rejected"
        } successfully.`,
      });
    } catch (error: unknown) {
      const e = error as ApiError;
      toast({
        title: "Error updating user status",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const handleLoanAction = async (
    loanId: string,
    action: "approved" | "denied"
  ) => {
    try {
      const updates: Partial<RawLoanData> = {
        status: action,
        admin_notes: adminNotes || null,
      };

      if (action === "approved") {
        updates.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("loans")
        .update(updates)
        .eq("id", loanId);

      if (error) throw error;

      setLoans(
        loans.map((loan) =>
          loan.id === loanId ? { ...loan, ...updates } : loan
        )
      );

      setSelectedLoan(null);
      setAdminNotes("");

      toast({
        title: `Loan ${action}`,
        description: `Loan application has been ${action} successfully.`,
      });
    } catch (error: unknown) {
      const e = error as ApiError;
      toast({
        title: "Error updating loan",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/auth";
    } catch (error: unknown) {
      const e = error as ApiError;
      toast({
        title: "Error signing out",
        description: e.message,
        variant: "destructive",
      });
    }
  };

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

  const handleAddContribution = async () => {
    if (!contributionData) return;

    try {
      const amount = parseFloat(contributionAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const { error } = await supabase.from("contributions").insert({
        user_id: contributionData.userId,
        amount: amount,
        status: "completed",
        reference_number: contributionReference,
        payment_date: contributionDate.toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Contribution added successfully",
        description: `Added ${amount.toLocaleString()} RWF for ${
          contributionData.userName
        }`,
      });

      // Reload data
      loadAdminData();
      setShowContributionDialog(false);
      setContributionAmount("");
      setContributionReference("");
      setContributionDate(new Date());
      setContributionData(null);
    } catch (error: unknown) {
      const e = error as ApiError;
      toast({
        title: "Error adding contribution",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const calculateLoanDetails = (principal: number, months: number = 3) => {
    const interestRate = 0.05; // 5% interest
    const totalInterest = principal * interestRate;
    const totalAmount = principal + totalInterest;
    const monthlyPayment = totalAmount / months;

    const paymentSchedule: Partial<LoanPayment>[] = [];
    const startDate = new Date();

    for (let i = 0; i < months; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);

      paymentSchedule.push({
        amount: monthlyPayment,
        due_date: dueDate.toISOString(),
        paid_amount: 0,
        status: "pending",
      });
    }

    return {
      totalAmount,
      monthlyPayment,
      paymentSchedule,
    };
  };

  const handleLoanDecision = async (approved: boolean) => {
    if (!selectedLoan) return;

    try {
      if (approved) {
        const { totalAmount, monthlyPayment, paymentSchedule } =
          calculateLoanDetails(selectedLoan.amount);

        // First, create the loan
        const { error: loanError } = await supabase
          .from("loans")
          .update({
            status: "approved",
            admin_notes: adminNotes || null,
            approved_at: new Date().toISOString(),
            due_date: new Date(
              Date.now() + 90 * 24 * 60 * 60 * 1000
            ).toISOString(), // 3 months from now
            interest_rate: 0.05,
            total_with_interest: totalAmount,
            amount_paid: 0,
            installments_count: 3,
          })
          .eq("id", selectedLoan.id);

        if (loanError) throw loanError;

        // Create the payment records
        const loanPayments: DbLoanPayment[] = paymentSchedule.map(
          (payment, index) => ({
            loan_id: selectedLoan.id,
            amount: payment.amount!,
            due_date: payment.due_date!,
            paid_amount: 0,
            paid_date: null,
            status: "pending",
            installment_number: index + 1,
            notes: null,
          })
        );

        // Insert the payment records
        const { error: scheduleError } = await supabase
          .from("loan_payments")
          .insert(loanPayments);

        if (scheduleError) throw scheduleError;

        toast({
          title: "Loan approved",
          description: `${
            selectedLoan.userName
          }'s loan has been approved. Monthly payment: ${monthlyPayment.toLocaleString()} RWF`,
        });
      } else {
        // Handle loan denial
        const { error } = await supabase
          .from("loans")
          .update({
            status: "denied",
            admin_notes: adminNotes || null,
          })
          .eq("id", selectedLoan.id);

        if (error) throw error;

        toast({
          title: "Loan denied",
          description: `${selectedLoan.userName}'s loan application has been denied.`,
        });
      }

      // Reload data
      loadAdminData();
      setShowLoanDialog(false);
      setSelectedLoan(null);
      setAdminNotes("");
    } catch (error: unknown) {
      const e = error as ApiError;
      toast({
        title: "Error updating loan status",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const checkOverdueLoans = async () => {
    try {
      const today = new Date().toISOString();

      // Get all approved loans with payments
      const { data: activeLoans, error: loansError } = await supabase
        .from("loans")
        .select(
          `
          *,
          loan_payments (*)
        `
        )
        .eq("status", "approved");

      if (loansError) throw loansError;

      // Check each loan for overdue payments
      for (const loan of activeLoans || []) {
        const overduePayments = (loan.loan_payments || []).filter(
          (payment: DbLoanPayment) =>
            payment.status === "pending" &&
            new Date(payment.due_date) < new Date(today)
        );

        if (overduePayments.length > 0) {
          // Update loan status to defaulted
          const { error: updateError } = await supabase
            .from("loans")
            .update({
              status: "defaulted",
              admin_notes: `Loan defaulted due to overdue payments as of ${new Date().toLocaleDateString()}`,
            })
            .eq("id", loan.id);

          if (updateError) throw updateError;

          // Update user status to inactive
          const { error: userError } = await supabase
            .from("profiles")
            .update({
              is_approved: false,
              status: "inactive",
            })
            .eq("user_id", loan.user_id);

          if (userError) throw userError;

          toast({
            title: "Loan Defaulted",
            description: `A loan has been marked as defaulted and the user has been deactivated.`,
            variant: "destructive",
          });
        }
      }
    } catch (error: unknown) {
      const e = error as ApiError;
      toast({
        title: "Error checking loans",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      const interval = setInterval(checkOverdueLoans, 24 * 60 * 60 * 1000); // Check daily
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const generatePDF = async () => {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const helveticaFont = await pdfDoc.embedFont("Helvetica");
      const fontSize = 12;

      // Add title
      page.drawText("Inzozi Nziza Community Hub - Report", {
        x: 50,
        y: height - 50,
        size: 20,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      // Add date
      page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
        x: 50,
        y: height - 80,
        size: fontSize,
        font: helveticaFont,
      });

      // Add summary statistics
      const totalContributions = contributions
        .filter((c) => c.status === "completed")
        .reduce((sum, c) => sum + c.amount, 0);

      const totalLoans = loans
        .filter((l) => l.status === "approved")
        .reduce((sum, l) => sum + l.amount, 0);

      let y = height - 120;
      const statistics = [
        `Total Users: ${users.length}`,
        `Pending Approvals: ${users.filter((u) => !u.is_approved).length}`,
        `Total Contributions: ${totalContributions.toLocaleString()} RWF`,
        `Total Loans: ${totalLoans.toLocaleString()} RWF`,
        `Pending Loans: ${loans.filter((l) => l.status === "pending").length}`,
      ];

      statistics.forEach((stat) => {
        page.drawText(stat, {
          x: 50,
          y,
          size: fontSize,
          font: helveticaFont,
        });
        y -= 20;
      });

      // Add user list
      y -= 40;
      page.drawText("User List:", {
        x: 50,
        y,
        size: 16,
        font: helveticaFont,
      });

      y -= 30;
      users.forEach((user) => {
        if (y < 50) {
          // Add new page if we're running out of space
          page = pdfDoc.addPage();
          y = height - 50;
        }

        page.drawText(
          `${
            user.full_name
          } - ${user.total_contributions.toLocaleString()} RWF`,
          {
            x: 50,
            y,
            size: fontSize,
            font: helveticaFont,
          }
        );
        y -= 20;
      });

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      // Create a download link
      const buffer = new Uint8Array(pdfBytes).buffer;
      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inzozi-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: unknown) {
      const e = error as ApiError;
      toast({
        title: "Error generating PDF",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  // Update handlePaymentUpdate function to handle new payments
  const handlePaymentUpdate = async () => {
    if (!paymentData) return;

    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      // Get current loan data
      type LoanFields = Pick<
        RawLoanData,
        "amount_paid" | "total_with_interest" | "amount" | "status"
      >;
      const { data: currentLoan, error: loanError } = (await supabase
        .from("loans")
        .select("amount_paid, total_with_interest, amount, status")
        .eq("id", paymentData.loanId)
        .single()) as { data: LoanFields | null; error: PostgrestError | null };

      if (loanError) throw loanError;
      if (!currentLoan) throw new Error("Loan not found");

      const totalLoanAmount =
        currentLoan.total_with_interest || currentLoan.amount;
      const currentAmountPaid = currentLoan.amount_paid || 0;
      const remainingAmount = totalLoanAmount - currentAmountPaid;

      if (amount > remainingAmount) {
        throw new Error("Payment amount cannot exceed the remaining balance");
      }

      // Update the loan record with the new amount_paid
      const newAmountPaid = currentAmountPaid + amount;
      // Keep status as 'approved' if it's already approved
      const newStatus =
        currentLoan.status === "approved" ? "approved" : "pending";

      const { error: updateError } = await supabase
        .from("loans")
        .update({
          amount_paid: newAmountPaid,
          last_payment_date: new Date().toISOString(),
          status: newStatus,
        })
        .eq("id", paymentData.loanId);

      if (updateError) throw updateError;

      // Record the payment in loan_payments
      const { error: paymentError } = await supabase
        .from("loan_payments")
        .insert({
          loan_id: paymentData.loanId,
          amount: amount,
          paid_amount: amount,
          paid_date: new Date().toISOString(),
          due_date: new Date().toISOString(),
          status: "paid",
        });

      if (paymentError) throw paymentError;

      toast({
        title: "Payment Updated",
        description: `Payment of ${amount.toLocaleString()} RWF has been recorded.`,
      });

      // Reload data
      loadAdminData();
      setShowPaymentDialog(false);
      setPaymentData(null);
      setPaymentAmount("");
    } catch (error: unknown) {
      const e = error as ApiError;
      toast({
        title: "Error updating payment",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  // Add function to handle opening the payment dialog
  const handleOpenPaymentDialog = (
    loan: Loan,
    payment: LoanPayment,
    userName: string
  ) => {
    setPaymentData({
      loanId: loan.id,
      paymentId: payment.id || "",
      userName,
      amount: payment.amount,
      paidAmount: payment.paid_amount || 0,
      dueDate: payment.due_date,
      status: payment.status,
      isNewPayment: !payment.id,
    });
    setShowPaymentDialog(true);
  };

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
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
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="mt-6 w-full"
            >
              Go to dashboard
            </Button>
          </GlassPanel>
        </div>
      </MarketingLayout>
    );
  }

  // Calculate totals
  const totalContributions = contributions
    .filter((c) => c.status === "completed")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPendingContributions = contributions.filter(
    (c) => c.status === "pending"
  ).length;

  const totalLoans = loans.reduce((sum, l) => sum + l.amount, 0);
  const pendingLoans = loans.filter((l) => l.status === "pending").length;

  const totalFinesAmount = fines.reduce((sum, fine) => sum + fine.amount, 0);
  const unpaidFinesCount = fines.filter(fine => !fine.paid_at).length;

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
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.phone || "No phone"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_approved ? "default" : "secondary"}
                          >
                            {user.is_approved ? "Approved" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.total_contributions.toLocaleString()} RWF
                        </TableCell>
                        <TableCell>{user.pending_contributions}</TableCell>
                        <TableCell>{user.loan_count}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setContributionData({
                                  userId: user.user_id,
                                  userName: user.full_name,
                                  amount: 0,
                                  paymentDate: new Date(),
                                });
                                setShowContributionDialog(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Contribution
                            </Button>
                            {!user.is_approved && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  handleUserApproval(user.user_id, true)
                                }
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
                      const user = users.find(
                        (u) => u.user_id === contribution.user_id
                      );
                      return (
                        <TableRow key={contribution.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {user?.full_name || "Unknown"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {contribution.amount.toLocaleString()} RWF
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(contribution.status)}
                              <Badge
                                variant={getStatusVariant(contribution.status)}
                              >
                                {contribution.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(
                              contribution.payment_date
                            ).toLocaleDateString()}
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
                      const user = users.find(
                        (u) => u.user_id === loan.user_id
                      );
                      return (
                        <TableRow key={loan.id}>
                          <TableCell>{user?.full_name || "Unknown"}</TableCell>
                          <TableCell>
                            {loan.amount.toLocaleString()} RWF
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {loan.purpose}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(loan.status)}>
                              {loan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(loan.applied_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              {loan.status === "pending" && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedLoan({
                                        id: loan.id,
                                        user_id: loan.user_id,
                                        userName: user?.full_name || "Unknown",
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
                                </div>
                              )}
                              {loan.status === "approved" && (
                                <div className="bg-muted p-3 rounded-md space-y-2">
                                  {loan.amount_paid >=
                                  (loan.total_with_interest || loan.amount) ? (
                                    <div className="space-y-4">
                                      <div className="flex justify-between text-sm">
                                        <span>Progress</span>
                                        <span>
                                          {loan.amount_paid.toLocaleString()} /{" "}
                                          {(
                                            loan.total_with_interest ||
                                            loan.amount
                                          ).toLocaleString()}{" "}
                                          RWF
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/20 p-2 rounded-md">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                          Loan Successfully Paid
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span>Progress</span>
                                          <span>
                                            {loan.amount_paid.toLocaleString()}{" "}
                                            /{" "}
                                            {(
                                              loan.total_with_interest ||
                                              loan.amount
                                            ).toLocaleString()}{" "}
                                            RWF
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span>Remaining Balance:</span>
                                          <span>
                                            {(
                                              (loan.total_with_interest ||
                                                loan.amount) - loan.amount_paid
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
                                      </div>
                                      <div className="flex justify-end mt-2">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleOpenPaymentDialog(
                                              loan,
                                              {
                                                id: "",
                                                loan_id: loan.id,
                                                amount:
                                                  loan.total_with_interest ||
                                                  loan.amount,
                                                due_date:
                                                  loan.due_date ||
                                                  new Date().toISOString(),
                                                paid_amount:
                                                  loan.amount_paid || 0,
                                                paid_date:
                                                  loan.last_payment_date ||
                                                  null,
                                                status: "pending",
                                                installment_number: 1,
                                                notes: null,
                                              },
                                              user?.full_name || "Unknown"
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
              users={users.map((user) => ({
                user_id: user.user_id,
                full_name: user.full_name,
              }))}
              onUpdate={loadAdminData}
            />
          </TabsContent>
        </Tabs>

      {/* Add Contribution Dialog */}
      <Dialog
        open={showContributionDialog}
        onOpenChange={setShowContributionDialog}
      >
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
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
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
            <Button
              variant="outline"
              onClick={() => setShowContributionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddContribution}>Add Contribution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loan Review Dialog */}
      <Dialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Loan Application</DialogTitle>
            <DialogDescription>
              Review and make a decision on {selectedLoan?.userName}'s loan
              application
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
            <Button
              variant="destructive"
              onClick={() => handleLoanDecision(false)}
            >
              Deny
            </Button>
            <Button onClick={() => handleLoanDecision(true)}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Update Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Loan Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {paymentData?.userName}
            </DialogDescription>
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
                      ? (
                          paymentData.amount - paymentData.paidAmount
                        ).toLocaleString()
                      : 0}{" "}
                    RWF
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (RWF)</Label>
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter any amount to pay"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
            >
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
