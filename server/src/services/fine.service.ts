import type { FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "../lib/audit.js";
import { AuditAction } from "../types/rbac.js";
import { AppError } from "../utils/errors.js";
import type {
  IssueFineInput,
  RecordFinePaymentInput,
  CancelFineInput,
} from "../schemas/domain.schemas.js";

function mapFine(fine: {
  id: string;
  userId: string;
  amount: unknown;
  amountPaid: unknown;
  reason: string;
  status: string;
  issuedAt: Date;
  paidAt: Date | null;
  adminNotes: string | null;
  payments?: Array<{ id: string; amount: unknown; paidAt: Date }>;
  user?: { profile: { fullName: string } | null };
}) {
  const amount = Number(fine.amount);
  const amountPaid = Number(fine.amountPaid ?? 0);
  return {
    id: fine.id,
    userId: fine.userId,
    userName: fine.user?.profile?.fullName,
    amount,
    amountPaid,
    remaining: amount - amountPaid,
    reason: fine.reason,
    status: fine.status,
    issuedAt: fine.issuedAt,
    paidAt: fine.paidAt,
    adminNotes: fine.adminNotes,
    payments: (fine.payments ?? []).map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      paidAt: p.paidAt,
    })),
  };
}

export async function listOwnFines(userId: string) {
  const fines = await prisma.fine.findMany({
    where: { userId },
    include: { payments: { orderBy: { paidAt: "desc" } } },
    orderBy: { issuedAt: "desc" },
  });
  return fines.map((fine) => mapFine(fine));
}

export async function listAllFines() {
  const fines = await prisma.fine.findMany({
    include: {
      payments: { orderBy: { paidAt: "desc" } },
      user: { include: { profile: true } },
    },
    orderBy: { issuedAt: "desc" },
  });
  return fines.map((fine) => mapFine(fine));
}

export async function issueFine(
  adminId: string,
  input: IssueFineInput,
  request: FastifyRequest
) {
  const member = await prisma.profile.findUnique({ where: { userId: input.userId } });
  if (!member) {
    throw new AppError(404, "Member not found", "USER_NOT_FOUND");
  }

  const fine = await prisma.fine.create({
    data: {
      userId: input.userId,
      amount: input.amount,
      reason: input.reason,
      status: "PENDING",
      issuedById: adminId,
      adminNotes: input.adminNotes,
    },
  });

  await writeAuditLog({
    actorId: adminId,
    action: AuditAction.FINE_ISSUED,
    entityType: "fine",
    entityId: fine.id,
    metadata: { userId: input.userId, amount: input.amount, reason: input.reason },
    request,
  });

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: "FINE_ISSUED",
      title: "Fine issued",
      body: `A fine of ${input.amount.toLocaleString()} RWF has been issued: ${input.reason}`,
    },
  });

  return fine;
}

export async function recordFinePayment(
  adminId: string,
  fineId: string,
  input: RecordFinePaymentInput,
  request: FastifyRequest
) {
  const fine = await prisma.fine.findUnique({ where: { id: fineId } });
  if (!fine) {
    throw new AppError(404, "Fine not found", "FINE_NOT_FOUND");
  }
  if (fine.status !== "PENDING") {
    throw new AppError(400, "Only pending fines accept payments", "INVALID_STATUS");
  }

  const total = Number(fine.amount);
  const paid = Number(fine.amountPaid ?? 0);
  const remaining = total - paid;

  if (input.amount > remaining) {
    throw new AppError(400, "Payment exceeds remaining balance", "INVALID_AMOUNT");
  }

  const newAmountPaid = paid + input.amount;
  const isPaid = newAmountPaid >= total;

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.finePayment.create({
      data: {
        fineId,
        amount: input.amount,
        recordedById: adminId,
        notes: input.notes,
      },
    });

    const updatedFine = await tx.fine.update({
      where: { id: fineId },
      data: {
        amountPaid: newAmountPaid,
        status: isPaid ? "PAID" : "PENDING",
        paidAt: isPaid ? new Date() : null,
      },
    });

    return { payment, updatedFine };
  });

  await writeAuditLog({
    actorId: adminId,
    action: AuditAction.FINE_PAYMENT_RECORDED,
    entityType: "fine_payment",
    entityId: result.payment.id,
    metadata: { fineId, amount: input.amount, newAmountPaid },
    request,
  });

  if (isPaid) {
    await prisma.notification.create({
      data: {
        userId: fine.userId,
        type: "FINE_PAID",
        title: "Fine paid",
        body: `Your fine of ${total.toLocaleString()} RWF has been fully paid.`,
      },
    });
  }

  return result;
}

export async function cancelFine(
  adminId: string,
  fineId: string,
  input: CancelFineInput,
  request: FastifyRequest
) {
  const fine = await prisma.fine.findUnique({ where: { id: fineId } });
  if (!fine) {
    throw new AppError(404, "Fine not found", "FINE_NOT_FOUND");
  }
  if (fine.status !== "PENDING") {
    throw new AppError(400, "Only pending fines can be cancelled", "INVALID_STATUS");
  }

  const updated = await prisma.fine.update({
    where: { id: fineId },
    data: { status: "CANCELLED", adminNotes: input.adminNotes ?? fine.adminNotes },
  });

  await writeAuditLog({
    actorId: adminId,
    action: AuditAction.FINE_CANCELLED,
    entityType: "fine",
    entityId: fineId,
    metadata: { userId: fine.userId, adminNotes: input.adminNotes },
    request,
  });

  await prisma.notification.create({
    data: {
      userId: fine.userId,
      type: "FINE_CANCELLED",
      title: "Fine cancelled",
      body: "A fine on your account has been cancelled.",
    },
  });

  return updated;
}
