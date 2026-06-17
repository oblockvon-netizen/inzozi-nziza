import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changePasswordSchema,
  type SignupInput,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
  type ResendVerificationInput,
  type ChangePasswordInput,
} from "../schemas/auth.schemas.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { authRateLimits } from "../middleware/rateLimit.js";
import {
  signup,
  login,
  refreshSession,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getMe,
  changePassword,
} from "../services/auth.service.js";
import {
  COOKIE_NAMES,
  accessCookieOptions,
  refreshCookieOptions,
  csrfCookieOptions,
  clearCookieOptions,
} from "../utils/cookies.js";
import { generateCsrfToken } from "../lib/tokens.js";
import type { SessionMeta } from "../types/auth.js";
import type { AuthTokens } from "../services/auth.service.js";

function sessionMeta(request: FastifyRequest): SessionMeta {
  return {
    ipAddress: request.ip,
    userAgent: request.headers["user-agent"],
  };
}

function setAuthCookies(reply: FastifyReply, tokens: AuthTokens): void {
  reply.setCookie(COOKIE_NAMES.access, tokens.accessToken, accessCookieOptions());
  reply.setCookie(COOKIE_NAMES.refresh, tokens.refreshToken, refreshCookieOptions());
  reply.setCookie(COOKIE_NAMES.csrf, tokens.csrfToken, csrfCookieOptions());
}

function clearAuthCookies(reply: FastifyReply): void {
  reply.clearCookie(COOKIE_NAMES.access, clearCookieOptions());
  reply.clearCookie(COOKIE_NAMES.refresh, clearCookieOptions());
  reply.clearCookie(COOKIE_NAMES.csrf, clearCookieOptions());
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get("/csrf", async (_request, reply) => {
    const csrfToken = generateCsrfToken();
    reply.setCookie(COOKIE_NAMES.csrf, csrfToken, csrfCookieOptions());
    return reply.send({ csrfToken });
  });

  app.post(
    "/signup",
    {
      ...authRateLimits.signup,
      preValidation: [validateBody(signupSchema)],
    },
    async (request, reply) => {
      const result = await signup(request.body as SignupInput, sessionMeta(request));
      setAuthCookies(reply, result.tokens);
      return reply.status(201).send({
        user: result.user,
        csrfToken: result.tokens.csrfToken,
      });
    }
  );

  app.post(
    "/login",
    {
      ...authRateLimits.login,
      preValidation: [validateBody(loginSchema)],
    },
    async (request, reply) => {
      const result = await login(request.body as LoginInput, sessionMeta(request));
      setAuthCookies(reply, result.tokens);
      return reply.send({
        user: result.user,
        csrfToken: result.tokens.csrfToken,
      });
    }
  );

  app.post(
    "/refresh",
    authRateLimits.refresh,
    async (request, reply) => {
      const refreshToken = request.cookies[COOKIE_NAMES.refresh];
      if (!refreshToken) {
        return reply.status(401).send({
          error: "INVALID_REFRESH_TOKEN",
          message: "Refresh token missing",
        });
      }

      const result = await refreshSession(refreshToken, sessionMeta(request));
      setAuthCookies(reply, result.tokens);
      return reply.send({
        user: result.user,
        csrfToken: result.tokens.csrfToken,
      });
    }
  );

  app.post("/logout", async (request, reply) => {
      const refreshToken = request.cookies[COOKIE_NAMES.refresh];
      await logout(refreshToken, request.authUser?.id);
      clearAuthCookies(reply);
      return reply.send({ message: "Logged out successfully" });
    });

  app.post(
    "/forgot-password",
    {
      ...authRateLimits.forgotPassword,
      preValidation: [validateBody(forgotPasswordSchema)],
    },
    async (request, reply) => {
      await forgotPassword(request.body as ForgotPasswordInput);
      return reply.send({
        message: "If an account exists for that email, a reset link has been sent.",
      });
    }
  );

  app.post(
    "/reset-password",
    {
      preValidation: [validateBody(resetPasswordSchema)],
    },
    async (request, reply) => {
      await resetPassword(request.body as ResetPasswordInput);
      clearAuthCookies(reply);
      return reply.send({ message: "Password reset successfully. Please sign in." });
    }
  );

  app.post(
    "/verify-email",
    {
      preValidation: [validateBody(verifyEmailSchema)],
    },
    async (request, reply) => {
      const user = await verifyEmail(request.body as VerifyEmailInput);
      return reply.send({ user, message: "Email verified successfully" });
    }
  );

  app.post(
    "/resend-verification",
    {
      ...authRateLimits.resendVerification,
      preHandler: [optionalAuth],
      preValidation: [validateBody(resendVerificationSchema)],
    },
    async (request, reply) => {
      await resendVerification(
        request.body as ResendVerificationInput,
        request.authUser
      );
      return reply.send({ message: "If the account exists, a verification email has been sent." });
    }
  );

  app.get(
    "/me",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const user = await getMe(request.authUser!.id);
      return reply.send({ user });
    }
  );

  app.post(
    "/change-password",
    {
      preHandler: [requireAuth],
      preValidation: [validateBody(changePasswordSchema)],
    },
    async (request, reply) => {
      await changePassword(request.authUser!.id, request.body as ChangePasswordInput);
      const refreshToken = request.cookies[COOKIE_NAMES.refresh];
      await logout(refreshToken, request.authUser!.id);
      clearAuthCookies(reply);
      return reply.send({
        message: "Password changed successfully. Please sign in again.",
      });
    }
  );
}
