import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken } from "../lib/jwt.js";
import { AppError } from "../utils/errors.js";
import { COOKIE_NAMES } from "../utils/cookies.js";
import { buildAuthUser } from "../services/user.service.js";

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

async function attachAuthUser(request: FastifyRequest): Promise<void> {
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

  try {
    request.authUser = await buildAuthUser(payload.sub);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      throw new AppError(401, "User not found", "UNAUTHORIZED");
    }
    throw error;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  await attachAuthUser(request);
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
    request.authUser = await buildAuthUser(payload.sub);
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

/** @deprecated Use requireAccessRole('USER') or requirePermission instead */
export async function requireApprovedMember(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (request.authUser?.accessRole !== "USER") {
    throw new AppError(403, "Account pending admin approval", "ACCOUNT_NOT_APPROVED");
  }
}

/** @deprecated Use requireAccessRole('ADMIN') or requirePermission instead */
export async function requireAdmin(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (request.authUser?.accessRole !== "ADMIN") {
    throw new AppError(403, "Admin access required", "FORBIDDEN");
  }
}
