import type { FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "../lib/audit.js";
import { AuditAction } from "../types/rbac.js";
import { AppError } from "../utils/errors.js";
import type { RecordContributionInput } from "../schemas/domain.schemas.js";

const REQUIRED_MONTHLY_CONTRIBUTION = 105_000;

export async function listOwnContributions(userId: string) {
  return prisma.contribution.findMany({
    where: { userId },
    orderBy: { paymentDate: "desc" },
  });
}

export async function getContributionSummary(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const contributions = await prisma.contribution.findMany({
    where: {
      userId,
      status: "COMPLETED",
      paymentDate: { gte: startOfMonth },
    },
  });

  const totalThisMonth = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
  const progress = Math.min((totalThisMonth / REQUIRED_MONTHLY_CONTRIBUTION) * 100, 100);

  return {
    requiredMonthlyContribution: REQUIRED_MONTHLY_CONTRIBUTION,
    totalThisMonth,
    remaining: Math.max(REQUIRED_MONTHLY_CONTRIBUTION - totalThisMonth, 0),
    progressPercent: progress,
    isComplete: totalThisMonth >= REQUIRED_MONTHLY_CONTRIBUTION,
    month: now.toLocaleString("default", { month: "long", year: "numeric" }),
  };
}

export async function listAllContributions() {
  const contributions = await prisma.contribution.findMany({
    orderBy: { paymentDate: "desc" },
    include: {
      user: { include: { profile: true } },
      recordedBy: { include: { profile: true } },
    },
  });

  return contributions.map((c) => ({
    id: c.id,
    userId: c.userId,
    userName: c.user.profile?.fullName ?? "Unknown",
    amount: Number(c.amount),
    paymentDate: c.paymentDate,
    status: c.status,
    referenceNumber: c.referenceNumber,
    recordedBy: c.recordedBy?.profile?.fullName ?? null,
    notes: c.notes,
    createdAt: c.createdAt,
  }));
}

export async function recordContribution(
  adminId: string,
  input: RecordContributionInput,
  request: FastifyRequest
) {
  const member = await prisma.profile.findUnique({ where: { userId: input.userId } });
  if (!member) {
    throw new AppError(404, "Member not found", "USER_NOT_FOUND");
  }

  const contribution = await prisma.contribution.create({
    data: {
      userId: input.userId,
      amount: input.amount,
      status: "COMPLETED",
      paymentDate: input.paymentDate ?? new Date(),
      referenceNumber: input.referenceNumber,
      recordedById: adminId,
      notes: input.notes,
    },
  });

  await writeAuditLog({
    actorId: adminId,
    action: AuditAction.CONTRIBUTION_RECORDED,
    entityType: "contribution",
    entityId: contribution.id,
    metadata: {
      userId: input.userId,
      amount: input.amount,
      referenceNumber: input.referenceNumber,
    },
    request,
  });

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: "CONTRIBUTION_RECORDED",
      title: "Contribution recorded",
      body: `A contribution of ${input.amount.toLocaleString()} RWF has been recorded on your account.`,
    },
  });

  return contribution;
}
