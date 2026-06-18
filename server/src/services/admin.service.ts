import type { FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "../lib/audit.js";
import { AuditAction } from "../types/rbac.js";
import { AppError } from "../utils/errors.js";
import type { ApproveMemberInput, RejectMemberInput } from "../schemas/domain.schemas.js";

const REQUIRED_MONTHLY_CONTRIBUTION = 105_000;

export async function listUsers() {
  const profiles = await prisma.profile.findMany({
    include: {
      user: {
        include: {
          userRoles: { include: { role: true } },
          contributions: true,
          loans: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return profiles.map((profile) => {
    const completed = profile.user.contributions.filter((c) => c.status === "COMPLETED");
    return {
      id: profile.id,
      userId: profile.userId,
      fullName: profile.fullName,
      phone: profile.phone,
      email: profile.user.email,
      isApproved: profile.isApproved,
      status: profile.status,
      roles: profile.user.userRoles.map((ur) => ur.role.name),
      totalContributions: completed.reduce((sum, c) => sum + Number(c.amount), 0),
      pendingContributions: profile.user.contributions.filter((c) => c.status === "PENDING").length,
      loanCount: profile.user.loans.length,
      createdAt: profile.createdAt,
    };
  });
}

export async function approveMember(
  adminId: string,
  userId: string,
  input: ApproveMemberInput,
  request: FastifyRequest
) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  const updated = await prisma.profile.update({
    where: { userId },
    data: {
      isApproved: true,
      status: "ACTIVE",
    },
  });

  await writeAuditLog({
    actorId: adminId,
    action: AuditAction.MEMBER_APPROVED,
    entityType: "profile",
    entityId: updated.id,
    metadata: { userId, adminNotes: input.adminNotes },
    request,
  });

  await prisma.notification.create({
    data: {
      userId,
      type: "MEMBER_APPROVED",
      title: "Account approved",
      body: "Your Inzozi Nziza membership has been approved. You can now access all member features.",
    },
  });

  return updated;
}

export async function rejectMember(
  adminId: string,
  userId: string,
  input: RejectMemberInput,
  request: FastifyRequest
) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  const updated = await prisma.profile.update({
    where: { userId },
    data: {
      isApproved: false,
      status: "INACTIVE",
    },
  });

  await writeAuditLog({
    actorId: adminId,
    action: AuditAction.MEMBER_REJECTED,
    entityType: "profile",
    entityId: updated.id,
    metadata: { userId, adminNotes: input.adminNotes },
    request,
  });

  await prisma.notification.create({
    data: {
      userId,
      type: "MEMBER_REJECTED",
      title: "Account not approved",
      body: "Your membership application was not approved. Contact an administrator for details.",
    },
  });

  return updated;
}

export async function getAdminStats() {
  const [userCount, pendingCount, contributions, loans, fines] = await Promise.all([
    prisma.profile.count(),
    prisma.profile.count({ where: { isApproved: false, status: "PENDING" } }),
    prisma.contribution.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.loan.aggregate({ _sum: { amount: true } }),
    prisma.fine.aggregate({ _sum: { amount: true } }),
  ]);

  return {
    userCount,
    pendingApprovals: pendingCount,
    totalContributions: Number(contributions._sum.amount ?? 0),
    totalLoans: Number(loans._sum.amount ?? 0),
    totalFines: Number(fines._sum.amount ?? 0),
    requiredMonthlyContribution: REQUIRED_MONTHLY_CONTRIBUTION,
  };
}

export async function listAuditLogs(query: {
  page: number;
  limit: number;
  action?: string;
}) {
  const skip = (query.page - 1) * query.limit;

  const where = query.action ? { action: query.action } : undefined;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      actor: log.actor
        ? {
            id: log.actor.id,
            email: log.actor.email,
            fullName: log.actor.profile?.fullName,
          }
        : null,
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}
