import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";
import { generateSecureToken } from "../lib/tokens.js";
import { AppError } from "../utils/errors.js";
import type { SessionMeta } from "../types/auth.js";
import type { AuthResponse } from "./auth.service.js";
import { createAuthSession } from "./auth.service.js";
import type { GoogleProfile } from "../lib/google-oauth.js";

async function getUserRoleId(): Promise<string> {
  const role = await prisma.role.findUnique({ where: { name: "USER" } });
  if (!role) {
    throw new AppError(500, "USER role is not configured. Run database seed.", "ROLE_MISSING");
  }
  return role.id;
}

export async function authenticateWithGoogle(
  profile: GoogleProfile,
  meta: SessionMeta
): Promise<AuthResponse> {
  const existingByGoogle = await prisma.user.findUnique({
    where: { googleId: profile.sub },
  });

  if (existingByGoogle) {
    await prisma.user.update({
      where: { id: existingByGoogle.id },
      data: {
        lastActiveAt: new Date(),
        emailVerifiedAt: existingByGoogle.emailVerifiedAt ?? new Date(),
      },
    });
    return createAuthSession(existingByGoogle.id, meta);
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: profile.email },
  });

  if (existingByEmail) {
    if (existingByEmail.googleId && existingByEmail.googleId !== profile.sub) {
      throw new AppError(
        409,
        "This email is linked to a different Google account",
        "GOOGLE_ACCOUNT_CONFLICT"
      );
    }

    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        googleId: profile.sub,
        emailVerifiedAt: existingByEmail.emailVerifiedAt ?? new Date(),
        lastActiveAt: new Date(),
      },
    });

    return createAuthSession(existingByEmail.id, meta);
  }

  const userRoleId = await getUserRoleId();
  const passwordHash = await hashPassword(generateSecureToken(48));

  const user = await prisma.user.create({
    data: {
      email: profile.email,
      passwordHash,
      googleId: profile.sub,
      emailVerifiedAt: profile.emailVerified ? new Date() : new Date(),
      profile: {
        create: {
          fullName: profile.fullName,
          phone: null,
          isApproved: false,
          status: "PENDING",
        },
      },
      userRoles: {
        create: { roleId: userRoleId },
      },
    },
  });

  return createAuthSession(user.id, meta);
}
