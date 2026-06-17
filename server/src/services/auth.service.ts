import { addHours, addMinutes, addDays } from "./date.js";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signAccessToken } from "../lib/jwt.js";
import { generateSecureToken, hashToken, generateCsrfToken } from "../lib/tokens.js";
import {
  buildPasswordResetEmail,
  buildVerificationEmail,
  sendEmail,
} from "../lib/email.js";
import { AppError } from "../utils/errors.js";
import type { AuthUser, SessionMeta } from "../types/auth.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  ResendVerificationInput,
  ResetPasswordInput,
  SignupInput,
  VerifyEmailInput,
  ChangePasswordInput,
} from "../schemas/auth.schemas.js";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

async function getUserRoleId(): Promise<string> {
  const role = await prisma.role.findUnique({ where: { name: "USER" } });
  if (!role) {
    throw new AppError(500, "USER role is not configured. Run database seed.", "ROLE_MISSING");
  }
  return role.id;
}

async function buildAuthUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      userRoles: { include: { role: true } },
    },
  });

  if (!user?.profile) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
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

async function issueTokens(userId: string, meta: SessionMeta): Promise<AuthTokens> {
  const user = await buildAuthUser(userId);
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    roles: user.roles,
    emailVerified: user.emailVerified,
  });

  const refreshToken = generateSecureToken();
  const refreshHash = hashToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: refreshHash,
      expiresAt: addDays(new Date(), env.REFRESH_TOKEN_TTL_DAYS),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });

  return {
    accessToken,
    refreshToken,
    csrfToken: generateCsrfToken(),
  };
}

async function createEmailVerificationToken(userId: string): Promise<string> {
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  const token = generateSecureToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: addHours(new Date(), env.EMAIL_VERIFICATION_TTL_HOURS),
    },
  });

  return token;
}

async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  const token = await createEmailVerificationToken(userId);
  const { subject, text } = buildVerificationEmail(token);
  await sendEmail({ to: email, subject, text });
}

export async function signup(input: SignupInput, meta: SessionMeta): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists", "EMAIL_EXISTS");
  }

  const passwordHash = await hashPassword(input.password);
  const userRoleId = await getUserRoleId();

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      profile: {
        create: {
          fullName: input.fullName,
          phone: input.phone,
          isApproved: false,
          status: "PENDING",
        },
      },
      userRoles: {
        create: { roleId: userRoleId },
      },
    },
  });

  await sendVerificationEmail(user.id, user.email);

  const authUser = await buildAuthUser(user.id);
  const tokens = await issueTokens(user.id, meta);

  return { user: authUser, tokens };
}

export async function login(input: LoginInput, meta: SessionMeta): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { profile: true },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    throw new AppError(
      423,
      `Account locked. Try again in ${minutesLeft} minute(s).`,
      "ACCOUNT_LOCKED"
    );
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const shouldLock = attempts >= env.MAX_FAILED_LOGIN_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: shouldLock
          ? addMinutes(new Date(), env.ACCOUNT_LOCKOUT_MINUTES)
          : null,
      },
    });

    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastActiveAt: new Date(),
    },
  });

  const authUser = await buildAuthUser(user.id);
  const tokens = await issueTokens(user.id, meta);

  return { user: authUser, tokens };
}

export async function refreshSession(
  refreshToken: string,
  meta: SessionMeta
): Promise<AuthResponse> {
  const tokenHash = hashToken(refreshToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError(401, "Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const authUser = await buildAuthUser(stored.userId);
  const tokens = await issueTokens(stored.userId, meta);

  return { user: authUser, tokens };
}

export async function logout(refreshToken?: string, userId?: string): Promise<void> {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  if (userId) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    return;
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = generateSecureToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: addHours(new Date(), env.PASSWORD_RESET_TTL_HOURS),
    },
  });

  const { subject, text } = buildPasswordResetEmail(token);
  await sendEmail({ to: user.email, subject, text });
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const tokenHash = hashToken(input.token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new AppError(400, "Invalid or expired reset token", "INVALID_RESET_TOKEN");
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

export async function verifyEmail(input: VerifyEmailInput): Promise<AuthUser> {
  const tokenHash = hashToken(input.token);

  const verification = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  });

  if (!verification || verification.expiresAt < new Date()) {
    throw new AppError(400, "Invalid or expired verification token", "INVALID_VERIFICATION_TOKEN");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.delete({ where: { id: verification.id } }),
  ]);

  return buildAuthUser(verification.userId);
}

export async function resendVerification(
  input: ResendVerificationInput,
  authUser?: AuthUser
): Promise<void> {
  const email = input.email ?? authUser?.email;
  if (!email) {
    throw new AppError(400, "Email is required", "EMAIL_REQUIRED");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return;
  }

  if (user.emailVerifiedAt) {
    throw new AppError(400, "Email is already verified", "ALREADY_VERIFIED");
  }

  await sendVerificationEmail(user.id, user.email);
}

export async function getMe(userId: string): Promise<AuthUser> {
  return buildAuthUser(userId);
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  const valid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Current password is incorrect", "INVALID_PASSWORD");
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export { buildAuthUser };
