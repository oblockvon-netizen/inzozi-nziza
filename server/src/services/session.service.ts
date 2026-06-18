import { prisma } from "../lib/prisma.js";
import { hashToken } from "../lib/tokens.js";
import { AppError } from "../utils/errors.js";
import { readSignedCookie } from "../utils/cookies.js";
import type { FastifyRequest } from "fastify";
import { COOKIE_NAMES } from "../utils/cookies.js";

export interface UserSessionView {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

function currentRefreshToken(request: FastifyRequest): string | undefined {
  return readSignedCookie(request, COOKIE_NAMES.refresh);
}

export async function listUserSessions(
  userId: string,
  request: FastifyRequest
): Promise<UserSessionView[]> {
  const currentHash = currentRefreshToken(request)
    ? hashToken(currentRefreshToken(request)!)
    : null;

  const sessions = await prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    userAgent: s.userAgent,
    ipAddress: s.ipAddress,
    createdAt: s.createdAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    current: currentHash !== null && s.tokenHash === currentHash,
  }));
}

export async function revokeSession(
  userId: string,
  sessionId: string
): Promise<void> {
  const session = await prisma.refreshToken.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new AppError(404, "Session not found", "SESSION_NOT_FOUND");
  }

  await prisma.refreshToken.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

export async function revokeOtherSessions(
  userId: string,
  request: FastifyRequest
): Promise<number> {
  const refresh = currentRefreshToken(request);
  if (!refresh) {
    throw new AppError(400, "Current session not found", "SESSION_NOT_FOUND");
  }

  const currentHash = hashToken(refresh);
  const result = await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
      tokenHash: { not: currentHash },
    },
    data: { revokedAt: new Date() },
  });

  return result.count;
}
