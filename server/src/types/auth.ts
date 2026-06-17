import type { AppRole } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  roles: AppRole[];
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
