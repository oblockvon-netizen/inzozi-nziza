export type AccessRole = "ADMIN" | "USER" | "PENDING_USER";

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  accessRole: AccessRole;
  permissions: string[];
  emailVerified: boolean;
  isApproved: boolean;
  status: string;
  fullName: string;
  phone: string | null;
}

export interface ApiErrorBody {
  error: string;
  message: string;
}

export interface ContributionSummary {
  requiredMonthlyContribution: number;
  totalThisMonth: number;
  remaining: number;
  progressPercent: number;
  isComplete: boolean;
  month: string;
}

export interface Contribution {
  id: string;
  userId: string;
  amount: number | string;
  paymentDate: string;
  status: string;
  referenceNumber?: string | null;
  notes?: string | null;
  userName?: string;
}

export interface LoanPayment {
  id: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  paidDate: string | null;
  status: string;
  installmentNumber?: number | null;
}

export interface Loan {
  id: string;
  userId: string;
  userName?: string;
  amount: number;
  purpose: string;
  status: string;
  appliedAt: string;
  approvedAt?: string | null;
  adminNotes?: string | null;
  dueDate?: string | null;
  interestRate?: number;
  totalWithInterest?: number;
  amountPaid?: number;
  lastPaymentDate?: string | null;
  installmentsCount?: number;
  payments?: LoanPayment[];
}

export interface FinePayment {
  id: string;
  amount: number;
  paidAt: string;
}

export interface Fine {
  id: string;
  userId: string;
  userName?: string;
  amount: number;
  amountPaid: number;
  remaining?: number;
  reason: string;
  status: string;
  issuedAt: string;
  paidAt?: string | null;
  adminNotes?: string | null;
  payments?: FinePayment[];
}

export interface AdminUser {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  email: string;
  isApproved: boolean;
  status: string;
  roles: string[];
  totalContributions: number;
  pendingContributions: number;
  loanCount: number;
  createdAt: string;
}

export interface AdminStats {
  userCount: number;
  pendingApprovals: number;
  totalContributions: number;
  totalLoans: number;
  totalFines: number;
  requiredMonthlyContribution: number;
}
