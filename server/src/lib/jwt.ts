import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AppRole } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: AppRole[];
  emailVerified: boolean;
  type: "access";
}

export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  const tokenPayload: AccessTokenPayload = { ...payload, type: "access" };
  return jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`,
    issuer: "inzozi-nziza",
    audience: "inzozi-nziza-api",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "inzozi-nziza",
    audience: "inzozi-nziza-api",
  }) as AccessTokenPayload;

  if (payload.type !== "access") {
    throw new Error("Invalid token type");
  }

  return payload;
}
