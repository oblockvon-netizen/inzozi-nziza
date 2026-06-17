import type { FastifyReply, FastifyRequest } from "fastify";
import type { AccessRole } from "../types/rbac.js";
import { AppError } from "../utils/errors.js";

export function requireAccessRole(...roles: AccessRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.authUser) {
      throw new AppError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (!roles.includes(request.authUser.accessRole)) {
      throw new AppError(403, "Insufficient role", "FORBIDDEN");
    }
  };
}

export const requireAdminRole = requireAccessRole("ADMIN");
export const requireMemberRole = requireAccessRole("USER");
export const requirePendingRole = requireAccessRole("PENDING_USER");

/** Active members only (not pending, not admin-only) */
export const requireActiveMember = requireAccessRole("USER");

/** Any authenticated user including pending members */
export const requireAnyAuthenticatedRole = requireAccessRole(
  "ADMIN",
  "USER",
  "PENDING_USER"
);
