import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../utils/errors.js";
import { COOKIE_NAMES } from "../utils/cookies.js";

const CSRF_EXEMPT_PREFIXES = [
  "/api/v1/auth/login",
  "/api/v1/auth/signup",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/verify-email",
  "/api/v1/auth/resend-verification",
  "/api/v1/auth/csrf",
  "/health",
];

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function csrfProtection(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (SAFE_METHODS.has(request.method)) {
    return;
  }

  const isExempt = CSRF_EXEMPT_PREFIXES.some((path) =>
    request.url.startsWith(path)
  );
  if (isExempt) {
    return;
  }

  const csrfCookie = request.cookies[COOKIE_NAMES.csrf];
  const csrfHeader = request.headers["x-csrf-token"];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    throw new AppError(403, "Invalid CSRF token", "CSRF_INVALID");
  }
}
