import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import { updateProfileSchema } from "../schemas/me.schemas.js";
import { notificationQuerySchema } from "../schemas/notification.schemas.js";
import { uuidParamSchema } from "../schemas/params.schemas.js";
import { updateProfile } from "../services/user.service.js";
import {
  listUserSessions,
  revokeSession,
  revokeOtherSessions,
} from "../services/session.service.js";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notification.service.js";
import { requireAccessRole } from "../middleware/role.js";
import { requirePermission } from "../middleware/permissions.js";
import { profileUpdate } from "../middleware/guards.js";
import { Permission } from "../types/rbac.js";

export async function meRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/pending-status",
    {
      preHandler: [
        requireAuth,
        requireAccessRole("PENDING_USER"),
        requirePermission(Permission.VIEW_PENDING_STATUS),
      ],
    },
    async (request, reply) => {
      return reply.send({
        status: request.authUser!.status,
        isApproved: request.authUser!.isApproved,
        accessRole: request.authUser!.accessRole,
        message:
          "Your account is pending admin approval. Financial features are unavailable until approved.",
      });
    }
  );

  app.patch(
    "/profile",
    {
      preHandler: profileUpdate,
      preValidation: [validateBody(updateProfileSchema)],
    },
    async (request, reply) => {
      const body = request.body as { fullName: string; phone?: string | null };
      const user = await updateProfile(request.authUser!.id, body);
      return reply.send({ user, message: "Profile updated successfully" });
    }
  );

  app.get("/sessions", { preHandler: [requireAuth] }, async (request, reply) => {
    const sessions = await listUserSessions(request.authUser!.id, request);
    return reply.send({ sessions });
  });

  app.delete(
    "/sessions/:id",
    {
      preHandler: [requireAuth],
      preValidation: [validateParams(uuidParamSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await revokeSession(request.authUser!.id, id);
      return reply.send({ message: "Session revoked" });
    }
  );

  app.post("/sessions/revoke-others", { preHandler: [requireAuth] }, async (request, reply) => {
    const count = await revokeOtherSessions(request.authUser!.id, request);
    return reply.send({ message: "Other sessions revoked", count });
  });

  app.get(
    "/notifications",
    {
      preHandler: [requireAuth],
      preValidation: [validateQuery(notificationQuerySchema)],
    },
    async (request, reply) => {
      const query = request.query as {
        read?: boolean;
        type?: string;
        limit?: number;
      };
      const notifications = await listNotifications(request.authUser!.id, query);
      return reply.send({ notifications });
    }
  );

  app.get("/notifications/unread-count", { preHandler: [requireAuth] }, async (request, reply) => {
    const count = await getUnreadCount(request.authUser!.id);
    return reply.send({ count });
  });

  app.patch(
    "/notifications/:id/read",
    {
      preHandler: [requireAuth],
      preValidation: [validateParams(uuidParamSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const notification = await markNotificationRead(request.authUser!.id, id);
      return reply.send({ notification });
    }
  );

  app.post("/notifications/read-all", { preHandler: [requireAuth] }, async (request, reply) => {
    const count = await markAllNotificationsRead(request.authUser!.id);
    return reply.send({ message: "All notifications marked as read", count });
  });
}
