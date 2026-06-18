import { format, subMonths, startOfMonth, parseISO, isValid } from "date-fns";
import type { Contribution, ContributionSummary, Fine, Loan } from "@/types/api";
import { isStatus, toNumber } from "@/lib/api";

export interface MonthlyTrendPoint {
  month: string;
  label: string;
  amount: number;
}

export interface RepaymentChartPoint {
  name: string;
  paid: number;
  remaining: number;
}

export interface GrowthPoint {
  date: string;
  label: string;
  cumulative: number;
}

export interface ActivityItem {
  id: string;
  type: "contribution" | "loan" | "fine";
  title: string;
  subtitle: string;
  amount: number;
  date: Date;
  status: string;
}

export interface DashboardNotification {
  id: string;
  variant: "info" | "warning" | "success";
  title: string;
  message: string;
}

function parseDate(value: string): Date {
  const d = parseISO(value);
  return isValid(d) ? d : new Date(value);
}

export function sumCompletedContributions(contributions: Contribution[]): number {
  return contributions
    .filter((c) => isStatus(c.status, "COMPLETED"))
    .reduce((sum, c) => sum + toNumber(c.amount), 0);
}

export function buildContributionTrends(
  contributions: Contribution[],
  months = 6
): MonthlyTrendPoint[] {
  const now = new Date();
  const buckets: MonthlyTrendPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const key = format(monthStart, "yyyy-MM");
    buckets.push({
      month: key,
      label: format(monthStart, "MMM"),
      amount: 0,
    });
  }

  contributions
    .filter((c) => isStatus(c.status, "COMPLETED"))
    .forEach((c) => {
      const key = format(parseDate(c.paymentDate), "yyyy-MM");
      const bucket = buckets.find((b) => b.month === key);
      if (bucket) {
        bucket.amount += toNumber(c.amount);
      }
    });

  return buckets;
}

export function buildGrowthHistory(contributions: Contribution[]): GrowthPoint[] {
  const completed = contributions
    .filter((c) => isStatus(c.status, "COMPLETED"))
    .map((c) => ({
      date: parseDate(c.paymentDate),
      amount: toNumber(c.amount),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let cumulative = 0;
  return completed.map((item) => {
    cumulative += item.amount;
    return {
      date: item.date.toISOString(),
      label: format(item.date, "MMM d"),
      cumulative,
    };
  });
}

export function buildRepaymentChart(loans: Loan[]): RepaymentChartPoint[] {
  return loans
    .filter((l) => isStatus(l.status, "APPROVED"))
    .map((loan, index) => {
      const total =
        toNumber(loan.totalWithInterest) || toNumber(loan.amount) * 1.05;
      const paid = toNumber(loan.amountPaid);
      return {
        name: `Loan ${index + 1}`,
        paid,
        remaining: Math.max(total - paid, 0),
      };
    });
}

export function buildActivityFeed(
  contributions: Contribution[],
  loans: Loan[],
  fines: Fine[],
  limit = 10
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...contributions.map((c) => ({
      id: `c-${c.id}`,
      type: "contribution" as const,
      title: "Contribution",
      subtitle: format(parseDate(c.paymentDate), "PPP"),
      amount: toNumber(c.amount),
      date: parseDate(c.paymentDate),
      status: c.status,
    })),
    ...loans.map((l) => ({
      id: `l-${l.id}`,
      type: "loan" as const,
      title: l.purpose || "Loan application",
      subtitle: `Applied ${format(parseDate(l.appliedAt), "PPP")}`,
      amount: toNumber(l.amount),
      date: parseDate(l.appliedAt),
      status: l.status,
    })),
    ...fines.map((f) => ({
      id: `f-${f.id}`,
      type: "fine" as const,
      title: f.reason,
      subtitle: `Issued ${format(parseDate(f.issuedAt), "PPP")}`,
      amount: toNumber(f.amount),
      date: parseDate(f.issuedAt),
      status: f.status,
    })),
  ];

  return items
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

export function buildNotifications(
  summary: ContributionSummary | null,
  loans: Loan[],
  fines: Fine[]
): DashboardNotification[] {
  const notes: DashboardNotification[] = [];

  if (summary && !summary.isComplete) {
    notes.push({
      id: "contrib-incomplete",
      variant: "warning",
      title: "Monthly contribution incomplete",
      message: `${summary.remaining.toLocaleString()} RWF remaining to meet your ${summary.requiredMonthlyContribution.toLocaleString()} RWF target.`,
    });
  }

  if (summary?.isComplete) {
    notes.push({
      id: "contrib-complete",
      variant: "success",
      title: "Monthly target met",
      message: "You've completed your contribution for this month. Great work!",
    });
  }

  const pendingLoans = loans.filter((l) => isStatus(l.status, "PENDING"));
  if (pendingLoans.length > 0) {
    notes.push({
      id: "loan-pending",
      variant: "info",
      title: "Loan under review",
      message: `${pendingLoans.length} application(s) awaiting admin approval.`,
    });
  }

  const recentApproved = loans.filter(
    (l) =>
      isStatus(l.status, "APPROVED") &&
      l.approvedAt &&
      Date.now() - parseDate(l.approvedAt).getTime() < 7 * 86400000
  );
  if (recentApproved.length > 0) {
    notes.push({
      id: "loan-approved",
      variant: "success",
      title: "Loan approved",
      message: "A recent loan application has been approved. Check repayment schedule.",
    });
  }

  const pendingFines = fines.filter((f) => isStatus(f.status, "PENDING"));
  const outstanding = pendingFines.reduce((sum, f) => {
    const rem =
      f.remaining != null ? toNumber(f.remaining) : toNumber(f.amount) - toNumber(f.amountPaid);
    return sum + rem;
  }, 0);

  if (pendingFines.length > 0) {
    notes.push({
      id: "fines-pending",
      variant: "warning",
      title: "Outstanding fines",
      message: `${outstanding.toLocaleString()} RWF across ${pendingFines.length} fine(s).`,
    });
  }

  return notes;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
