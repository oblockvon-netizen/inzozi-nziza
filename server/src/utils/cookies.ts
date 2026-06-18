import type { CookieSerializeOptions } from "@fastify/cookie";
import type { FastifyRequest } from "fastify";
import { env, isProduction } from "../config/env.js";

export const COOKIE_NAMES = {
  access: "inzozi_access",
  refresh: "inzozi_refresh",
  csrf: "inzozi_csrf",
} as const;

const baseCookieOptions: CookieSerializeOptions = {
  path: "/",
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  signed: true,
};

export function accessCookieOptions(): CookieSerializeOptions {
  return {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60,
  };
}

export function refreshCookieOptions(): CookieSerializeOptions {
  return {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  };
}

export function csrfCookieOptions(): CookieSerializeOptions {
  return {
    ...baseCookieOptions,
    httpOnly: false,
    signed: false,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  };
}

export function clearCookieOptions(): CookieSerializeOptions {
  return {
    ...baseCookieOptions,
    maxAge: 0,
  };
}

export function readSignedCookie(
  request: FastifyRequest,
  name: string
): string | undefined {
  const raw = request.cookies[name];
  if (!raw) {
    return undefined;
  }

  const unsigned = request.unsignCookie(raw);
  return unsigned.valid ? unsigned.value : undefined;
}
