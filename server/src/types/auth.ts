import type { AppRole } from "@prisma/client";
import type { AccessRole } from "./rbac.js";
import type { Permission } from "./rbac.js";

export interface AuthUser {
  id: string;
  email: string;
  roles: AppRole[];
  accessRole: AccessRole;
  permissions: Permission[];
  emailVerified: boolean;
  isApproved: boolean;
  status: string;
  fullName: string;
}

export interface SessionMeta {
  ipAddress?: string;
  userAgent?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}
