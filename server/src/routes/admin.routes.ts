import type { FastifyInstance } from "fastify";
import { validateBody, validateQuery, validateParams } from "../middleware/validate.js";
import {
  adminManageUsers,
  adminApproveMembers,
  adminOnly,
} from "../middleware/guards.js";
import {
  approveMemberSchema,
  rejectMemberSchema,
} from "../schemas/domain.schemas.js";
import {
  userIdParamSchema,
  auditLogQuerySchema,
} from "../schemas/params.schemas.js";
import {
  listUsers,
  approveMember,
  rejectMember,
  getAdminStats,
  listAuditLogs,
} from "../services/admin.service.js";
import { adminRateLimits } from "../middleware/rateLimit.js";

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/users",
    { preHandler: adminManageUsers },
    async (_request, reply) => {
      const users = await listUsers();
      return reply.send({ users });
    }
  );

  app.get(
    "/stats",
    { ...adminRateLimits.default, preHandler: adminOnly },
    async (_request, reply) => {
      const stats = await getAdminStats();
      return reply.send({ stats });
    }
  );

  app.get(
    "/audit-logs",
    {
      ...adminRateLimits.default,
      preHandler: adminOnly,
      preValidation: [validateQuery(auditLogQuerySchema)],
    },
    async (request, reply) => {
      const query = request.query as {
        page: number;
        limit: number;
        action?: string;
      };
      const result = await listAuditLogs(query);
      return reply.send(result);
    }
  );

  app.post(
    "/users/:userId/approve",
    {
      ...adminRateLimits.mutations,
      preHandler: adminApproveMembers,
      preValidation: [validateParams(userIdParamSchema), validateBody(approveMemberSchema)],
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const profile = await approveMember(
        request.authUser!.id,
        userId,
        request.body as { adminNotes?: string },
        request
      );
      return reply.send({ profile, message: "Member approved" });
    }
  );

  app.post(
    "/users/:userId/reject",
    {
      ...adminRateLimits.mutations,
      preHandler: adminApproveMembers,
      preValidation: [validateParams(userIdParamSchema), validateBody(rejectMemberSchema)],
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const profile = await rejectMember(
        request.authUser!.id,
        userId,
        request.body as { adminNotes?: string },
        request
      );
      return reply.send({ profile, message: "Member rejected" });
    }
  );
}
