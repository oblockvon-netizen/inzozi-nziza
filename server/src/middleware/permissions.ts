import type { FastifyReply, FastifyRequest } from "fastify";
import type { Permission } from "../types/rbac.js";
import { hasAllPermissions, hasAnyPermission } from "../lib/access-role.js";
import { AppError } from "../utils/errors.js";

export function requirePermission(...permissions: Permission[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.authUser) {
      throw new AppError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (!hasAllPermissions(request.authUser.accessRole, permissions)) {
      throw new AppError(403, "Insufficient permissions", "FORBIDDEN");
    }
  };
}

export function requireAnyPermission(...permissions: Permission[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.authUser) {
      throw new AppError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (!hasAnyPermission(request.authUser.accessRole, permissions)) {
      throw new AppError(403, "Insufficient permissions", "FORBIDDEN");
    }
  };
}
