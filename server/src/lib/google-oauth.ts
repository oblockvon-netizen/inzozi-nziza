import { createHash, randomBytes } from "node:crypto";
import { env, googleOAuthRedirectUri, isGoogleOAuthEnabled } from "../config/env.js";
import { AppError } from "../utils/errors.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  picture?: string;
}

export function assertGoogleOAuthConfigured(): void {
  if (!isGoogleOAuthEnabled()) {
    throw new AppError(
      503,
      "Google sign-in is not configured on this server",
      "GOOGLE_OAUTH_DISABLED"
    );
  }
}

export function createOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

export function buildGoogleAuthUrl(state: string): string {
  assertGoogleOAuthConfigured();

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleOAuthRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  assertGoogleOAuthConfigured();

  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID!,
    client_secret: env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: googleOAuthRedirectUri(),
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenRes.ok) {
    throw new AppError(401, "Google sign-in failed", "GOOGLE_AUTH_FAILED");
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new AppError(401, "Google sign-in failed", "GOOGLE_AUTH_FAILED");
  }

  const profileRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileRes.ok) {
    throw new AppError(401, "Could not load Google profile", "GOOGLE_AUTH_FAILED");
  }

  const profile = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  if (!profile.sub || !profile.email) {
    throw new AppError(400, "Google account must include an email address", "GOOGLE_EMAIL_REQUIRED");
  }

  return {
    sub: profile.sub,
    email: profile.email.toLowerCase(),
    emailVerified: Boolean(profile.email_verified),
    fullName: profile.name?.trim() || profile.email.split("@")[0] || "Google User",
    picture: profile.picture,
  };
}

export function hashOAuthState(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}
