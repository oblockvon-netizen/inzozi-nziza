import type { FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "../lib/audit.js";
import { AuditAction } from "../types/rbac.js";
import { AppError } from "../utils/errors.js";
import type {
  ApplyLoanInput,
  LoanDecisionInput,
  RecordLoanPaymentInput,
} from "../schemas/domain.schemas.js";
import { addDays } from "./date.js";

const INTEREST_RATE = 0.05;
const INSTALLMENTS = 3;

function calculateLoanDetails(principal: number, months = INSTALLMENTS) {
  const totalWithInterest = principal * (1 + INTEREST_RATE);
  const monthlyPayment = totalWithInterest / months;
  const schedule = [];

  for (let i = 0; i < months; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    schedule.push({ amount: monthlyPayment, dueDate });
  }

  return { totalWithInterest, monthlyPayment, schedule };
}

function mapLoan(loan: {
  id: string;
  userId: string;
  amount: unknown;
  purpose: string;
  status: string;
  appliedAt: Date;
  approvedAt: Date | null;
  adminNotes: string | null;
  dueDate: Date | null;
  interestRate: unknown;
  totalWithInterest: unknown;
  amountPaid: unknown;
  lastPaymentDate: Date | null;
  installmentsCount: number;
  payments?: Array<{
    id: string;
    amount: unknown;
    dueDate: Date;
    paidAmount: unknown;
    paidDate: Date | null;
    status: string;
    installmentNumber: number | null;
  }>;
  user?: { profile: { fullName: string } | null };
}) {
  return {
    id: loan.id,
    userId: loan.userId,
    userName: loan.user?.profile?.fullName,
    amount: Number(loan.amount),
    purpose: loan.purpose,
    status: loan.status,
    appliedAt: loan.appliedAt,
    approvedAt: loan.approvedAt,
    adminNotes: loan.adminNotes,
    dueDate: loan.dueDate,
    interestRate: loan.interestRate ? Number(loan.interestRate) : INTEREST_RATE,
    totalWithInterest: loan.totalWithInterest
      ? Number(loan.totalWithInterest)
      : Number(loan.amount) * (1 + INTEREST_RATE),
    amountPaid: Number(loan.amountPaid ?? 0),
    lastPaymentDate: loan.lastPaymentDate,
    installmentsCount: loan.installmentsCount,
    payments: (loan.payments ?? []).map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      dueDate: p.dueDate,
      paidAmount: Number(p.paidAmount ?? 0),
      paidDate: p.paidDate,
      status: p.status,
      installmentNumber: p.installmentNumber,
    })),
  };
}

export async function listOwnLoans(userId: string) {
  const loans = await prisma.loan.findMany({
    where: { userId },
    include: { payments: { orderBy: { installmentNumber: "asc" } } },
    orderBy: { appliedAt: "desc" },
  });
  return loans.map((loan) => mapLoan(loan));
}

export async function listAllLoans() {
  const loans = await prisma.loan.findMany({
    include: {
      payments: { orderBy: { installmentNumber: "asc" } },
      user: { include: { profile: true } },
    },
    orderBy: { appliedAt: "desc" },
  });
  return loans.map((loan) => mapLoan(loan));
}

export async function getLoan(loanId: string, requesterId: string, isAdmin: boolean) {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      payments: { orderBy: { installmentNumber: "asc" } },
      user: { include: { profile: true } },
    },
  });

  if (!loan) {
    throw new AppError(404, "Loan not found", "LOAN_NOT_FOUND");
  }

  if (!isAdmin && loan.userId !== requesterId) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  return mapLoan(loan);
}

export async function applyForLoan(
  userId: string,
  input: ApplyLoanInput,
  request: FastifyRequest
) {
  const loan = await prisma.loan.create({
    data: {
      userId,
      amount: input.amount,
      purpose: input.purpose,
      status: "PENDING",
    },
  });

  await writeAuditLog({
    actorId: userId,
    action: AuditAction.LOAN_APPLICATION_CREATED,
    entityType: "loan",
    entityId: loan.id,
    metadata: { amount: input.amount, purpose: input.purpose },
    request,
  });

  await prisma.notification.create({
    data: {
      userId,
      type: "LOAN_SUBMITTED",
      title: "Loan application submitted",
      body: `Your loan application for ${input.amount.toLocaleString()} RWF is pending admin review.`,
    },
  });

  return loan;
}

export async function approveLoan(
  adminId: string,
  loanId: string,
  input: LoanDecisionInput,
  request: FastifyRequest
) {
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) {
    throw new AppError(404, "Loan not found", "LOAN_NOT_FOUND");
  }
  if (loan.status !== "PENDING") {
    throw new AppError(400, "Only pending loans can be approved", "INVALID_STATUS");
  }

  const principal = Number(loan.amount);
  const { totalWithInterest, schedule } = calculateLoanDetails(principal);

  const updated = await prisma.$transaction(async (tx) => {
    const approved = await tx.loan.update({
      where: { id: loanId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        reviewedById: adminId,
        adminNotes: input.adminNotes ?? null,
        dueDate: addDays(new Date(), 90),
        interestRate: INTEREST_RATE,
        totalWithInterest,
        amountPaid: 0,
        installmentsCount: INSTALLMENTS,
      },
    });

    await tx.loanPayment.createMany({
      data: schedule.map((payment, index) => ({
        loanId,
        amount: payment.amount,
        dueDate: payment.dueDate,
        paidAmount: 0,
        status: "PENDING",
        installmentNumber: index + 1,
        recordedById: adminId,
      })),
    });

    return approved;
  });

  await writeAuditLog({
    actorId: adminId,
    action: AuditAction.LOAN_APPROVED,
    entityType: "loan",
    entityId: loanId,
    metadata: { userId: loan.userId, amount: principal, adminNotes: input.adminNotes },
    request,
  });

  await prisma.notification.create({
    data: {
      userId: loan.userId,
      type: "LOAN_APPROVED",
      title: "Loan approved",
      body: `Your loan application for ${principal.toLocaleString()} RWF has been approved.`,
    },
  });

  return updated;
}

export async function denyLoan(
  adminId: string,
  loanId: string,
  input: LoanDecisionInput,
  request: FastifyRequest
) {
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) {
    throw new AppError(404, "Loan not found", "LOAN_NOT_FOUND");
  }
  if (loan.status !== "PENDING") {
    throw new AppError(400, "Only pending loans can be denied", "INVALID_STATUS");
  }

  const updated = await prisma.loan.update({
    where: { id: loanId },
    data: {
      status: "DENIED",
      reviewedById: adminId,
      adminNotes: input.adminNotes ?? null,
    },
  });

  await writeAuditLog({
    actorId: adminId,
    action: AuditAction.LOAN_DENIED,
    entityType: "loan",
    entityId: loanId,
    metadata: { userId: loan.userId, adminNotes: input.adminNotes },
    request,
  });

  await prisma.notification.create({
    data: {
      userId: loan.userId,
      type: "LOAN_DENIED",
      title: "Loan denied",
      body: "Your loan application was not approved.",
    },
  });

  return updated;
}

export async function recordLoanPayment(
  adminId: string,
  loanId: string,
  input: RecordLoanPaymentInput,
  request: FastifyRequest
) {
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) {
    throw new AppError(404, "Loan not found", "LOAN_NOT_FOUND");
  }
  if (loan.status !== "APPROVED") {
    throw new AppError(400, "Payments can only be recorded on approved loans", "INVALID_STATUS");
  }

  const total = Number(loan.totalWithInterest ?? loan.amount);
  const paid = Number(loan.amountPaid ?? 0);
  const remaining = total - paid;

  if (input.amount > remaining) {
    throw new AppError(400, "Payment exceeds remaining balance", "INVALID_AMOUNT");
  }

  const newAmountPaid = paid + input.amount;

  const payment = await prisma.$transaction(async (tx) => {
    const updatedLoan = await tx.loan.update({
      where: { id: loanId },
      data: {
        amountPaid: newAmountPaid,
        lastPaymentDate: new Date(),
        status: newAmountPaid >= total ? "REPAID" : "APPROVED",
      },
    });

    const loanPayment = await tx.loanPayment.create({
      data: {
        loanId,
        amount: input.amount,
        dueDate: new Date(),
        paidAmount: input.amount,
        paidDate: new Date(),
        status: "PAID",
        notes: input.notes,
        recordedById: adminId,
      },
    });

    return { updatedLoan, loanPayment };
  });

  await writeAuditLog({
    actorId: adminId,
    action: AuditAction.LOAN_PAYMENT_RECORDED,
    entityType: "loan_payment",
    entityId: payment.loanPayment.id,
    metadata: { loanId, amount: input.amount, newAmountPaid },
    request,
  });

  return payment;
}
