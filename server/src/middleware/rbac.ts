import type { FastifyReply, FastifyRequest } from "fastify";
import type { AppRole } from "@prisma/client";
import { AppError } from "../utils/errors.js";

/** @deprecated Use requireAccessRole or requirePermission from role/permissions middleware */
export function requireRoles(...roles: AppRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.authUser) {
      throw new AppError(401, "Authentication required", "UNAUTHORIZED");
    }

    const hasRole = roles.some((role) => request.authUser!.roles.includes(role));
    if (!hasRole) {
      throw new AppError(403, "Insufficient permissions", "FORBIDDEN");
    }
  };
}

export const requireUser = requireRoles("USER", "ADMIN");
export const requireAdminDbRole = requireRoles("ADMIN");
