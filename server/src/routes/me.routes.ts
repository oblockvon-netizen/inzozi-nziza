import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { requireAccessRole } from "../middleware/role.js";
import { requirePermission } from "../middleware/permissions.js";
import { validateBody } from "../middleware/validate.js";
import { updateProfileSchema } from "../schemas/me.schemas.js";
import { updateProfile } from "../services/user.service.js";
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
      preHandler: [requireAuth],
      preValidation: [validateBody(updateProfileSchema)],
    },
    async (request, reply) => {
      const body = request.body as { fullName: string; phone?: string };
      const user = await updateProfile(request.authUser!.id, body);
      return reply.send({ user, message: "Profile updated successfully" });
    }
  );
}
