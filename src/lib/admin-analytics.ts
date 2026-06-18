import { format, subMonths, startOfMonth, parseISO, isValid } from "date-fns";
import type { AdminUser, Contribution, Fine, Loan } from "@/types/api";
import { isStatus, toNumber } from "@/lib/api";

export interface AdminKpis {
  totalMembers: number;
  pendingApprovals: number;
  activeLoans: number;
  totalContributions: number;
  outstandingDebt: number;
}

export interface MonthlyBarPoint {
  month: string;
  label: string;
  amount: number;
}

export interface GrowthAreaPoint {
  label: string;
  cumulative: number;
}

export interface PieSlice {
  name: string;
  value: number;
  fill: string;
}

export interface AdminNotification {
  id: string;
  variant: "info" | "warning" | "success";
  title: string;
  message: string;
}

export interface ApprovalItem {
  id: string;
  type: "user" | "loan";
  title: string;
  subtitle: string;
  amount?: number;
  date: Date;
}

function parseDate(value: string): Date {
  const d = parseISO(value);
  return isValid(d) ? d : new Date(value);
}

export function computeAdminKpis(
  users: AdminUser[],
  contributions: Contribution[],
  loans: Loan[],
  fines: Fine[]
): AdminKpis {
  const totalContributions = contributions
    .filter((c) => isStatus(c.status, "COMPLETED"))
    .reduce((sum, c) => sum + toNumber(c.amount), 0);

  const loanDebt = loans
    .filter((l) => isStatus(l.status, "APPROVED"))
    .reduce((sum, l) => {
      const total = toNumber(l.totalWithInterest) || toNumber(l.amount) * 1.05;
      return sum + Math.max(total - toNumber(l.amountPaid), 0);
    }, 0);

  const fineDebt = fines
    .filter((f) => isStatus(f.status, "PENDING"))
    .reduce((sum, f) => {
      const rem =
        f.remaining != null
          ? toNumber(f.remaining)
          : toNumber(f.amount) - toNumber(f.amountPaid);
      return sum + rem;
    }, 0);

  return {
    totalMembers: users.length,
    pendingApprovals: users.filter((u) => !u.isApproved).length,
    activeLoans: loans.filter((l) => isStatus(l.status, "APPROVED")).length,
    totalContributions,
    outstandingDebt: loanDebt + fineDebt,
  };
}

export function buildContributionBars(
  contributions: Contribution[],
  months = 6
): MonthlyBarPoint[] {
  const now = new Date();
  const buckets: MonthlyBarPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    buckets.push({
      month: format(monthStart, "yyyy-MM"),
      label: format(monthStart, "MMM"),
      amount: 0,
    });
  }

  contributions
    .filter((c) => isStatus(c.status, "COMPLETED"))
    .forEach((c) => {
      const key = format(parseDate(c.paymentDate), "yyyy-MM");
      const bucket = buckets.find((b) => b.month === key);
      if (bucket) bucket.amount += toNumber(c.amount);
    });

  return buckets;
}

export function buildPlatformGrowth(contributions: Contribution[]): GrowthAreaPoint[] {
  const completed = contributions
    .filter((c) => isStatus(c.status, "COMPLETED"))
    .map((c) => ({ date: parseDate(c.paymentDate), amount: toNumber(c.amount) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let cumulative = 0;
  return completed.map((item) => {
    cumulative += item.amount;
    return { label: format(item.date, "MMM d"), cumulative };
  });
}

const PIE_COLORS = [
  "hsl(var(--gold))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

export function buildLoanStatusPie(loans: Loan[]): PieSlice[] {
  const groups: Record<string, number> = {};
  loans.forEach((l) => {
    const key = l.status.toUpperCase();
    groups[key] = (groups[key] ?? 0) + 1;
  });

  return Object.entries(groups).map(([name, value], i) => ({
    name: name.charAt(0) + name.slice(1).toLowerCase(),
    value,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));
}

export function buildApprovalQueue(
  users: AdminUser[],
  loans: Loan[]
): ApprovalItem[] {
  const items: ApprovalItem[] = [
    ...users
      .filter((u) => !u.isApproved)
      .map((u) => ({
        id: u.userId,
        type: "user" as const,
        title: u.fullName,
        subtitle: u.email,
        date: parseDate(u.createdAt),
      })),
    ...loans
      .filter((l) => isStatus(l.status, "PENDING"))
      .map((l) => ({
        id: l.id,
        type: "loan" as const,
        title: l.userName ?? "Member",
        subtitle: l.purpose,
        amount: toNumber(l.amount),
        date: parseDate(l.appliedAt),
      })),
  ];

  return items.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function buildAdminNotifications(
  kpis: AdminKpis,
  contributions: Contribution[],
  loans: Loan[],
  fines: Fine[]
): AdminNotification[] {
  const notes: AdminNotification[] = [];

  if (kpis.pendingApprovals > 0) {
    notes.push({
      id: "pending-users",
      variant: "warning",
      title: "Member approvals pending",
      message: `${kpis.pendingApprovals} member(s) awaiting approval.`,
    });
  }

  const pendingLoans = loans.filter((l) => isStatus(l.status, "PENDING")).length;
  if (pendingLoans > 0) {
    notes.push({
      id: "pending-loans",
      variant: "warning",
      title: "Loan reviews pending",
      message: `${pendingLoans} loan application(s) need a decision.`,
    });
  }

  const pendingContrib = contributions.filter((c) =>
    isStatus(c.status, "PENDING")
  ).length;
  if (pendingContrib > 0) {
    notes.push({
      id: "pending-contrib",
      variant: "info",
      title: "Pending contributions",
      message: `${pendingContrib} contribution(s) need review or recording.`,
    });
  }

  const unpaidFines = fines.filter((f) => isStatus(f.status, "PENDING")).length;
  if (unpaidFines > 0) {
    notes.push({
      id: "unpaid-fines",
      variant: "warning",
      title: "Unpaid fines",
      message: `${unpaidFines} fine(s) outstanding across members.`,
    });
  }

  if (kpis.outstandingDebt > 0) {
    notes.push({
      id: "outstanding-debt",
      variant: "info",
      title: "Outstanding debt",
      message: `${kpis.outstandingDebt.toLocaleString()} RWF in loan + fine balances.`,
    });
  }

  if (notes.length === 0) {
    notes.push({
      id: "all-clear",
      variant: "success",
      title: "Operations clear",
      message: "No critical items require immediate attention.",
    });
  }

  return notes;
}

export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}
