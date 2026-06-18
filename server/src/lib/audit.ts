import type { FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import type { AuditAction } from "../types/rbac.js";

export interface AuditLogInput {
  actorId: string;
  action: AuditAction | string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  request?: FastifyRequest;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      ipAddress: input.request?.ip,
      userAgent: input.request?.headers["user-agent"],
    },
  });
}
