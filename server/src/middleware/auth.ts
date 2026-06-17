import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/errors.js";
import { COOKIE_NAMES } from "../utils/cookies.js";
import type { AuthUser } from "../types/auth.js";

async function loadAuthUser(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      userRoles: { include: { role: true } },
    },
  });

  if (!user || !user.profile) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    roles: user.userRoles.map((ur) => ur.role.name),
    emailVerified: Boolean(user.emailVerifiedAt),
    isApproved: user.profile.isApproved,
    status: user.profile.status,
    fullName: user.profile.fullName,
  };
}

function extractAccessToken(request: FastifyRequest): string | undefined {
  const cookieToken = request.cookies[COOKIE_NAMES.access];
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return undefined;
}

export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const token = extractAccessToken(request);
  if (!token) {
    throw new AppError(401, "Authentication required", "UNAUTHORIZED");
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError(401, "Invalid or expired access token", "INVALID_TOKEN");
  }

  const authUser = await loadAuthUser(payload.sub);
  if (!authUser) {
    throw new AppError(401, "User not found", "UNAUTHORIZED");
  }

  request.authUser = authUser;
}

export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const token = extractAccessToken(request);
  if (!token) {
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const authUser = await loadAuthUser(payload.sub);
    if (authUser) {
      request.authUser = authUser;
    }
  } catch {
    // Optional auth — ignore invalid tokens
  }
}

export async function requireEmailVerified(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (!request.authUser?.emailVerified) {
    throw new AppError(403, "Email verification required", "EMAIL_NOT_VERIFIED");
  }
}

export async function requireApprovedMember(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (!request.authUser?.isApproved || request.authUser.status !== "ACTIVE") {
    throw new AppError(403, "Account pending admin approval", "ACCOUNT_NOT_APPROVED");
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (!request.authUser?.roles.includes("ADMIN")) {
    throw new AppError(403, "Admin access required", "FORBIDDEN");
  }
}
