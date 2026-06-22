import { config as loadEnv } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../../.env") });
loadEnv({ path: resolve(__dirname, "../.env") });

const DEFAULT_SECRETS = [
  "change-me-access-secret-min-32-chars",
  "change-me-refresh-secret-min-32-chars",
  "change-me-cookie-secret-min-32-chars",
];

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().optional(),
    API_URL: z.string().url().default("http://localhost:3000"),
    APP_URL: z.string().url().default("http://localhost:8080"),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    COOKIE_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
    MAX_FAILED_LOGIN_ATTEMPTS: z.coerce.number().default(5),
    ACCOUNT_LOCKOUT_MINUTES: z.coerce.number().default(15),
    EMAIL_VERIFICATION_TTL_HOURS: z.coerce.number().default(24),
    PASSWORD_RESET_TTL_HOURS: z.coerce.number().default(1),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().default("Inzozi Nziza <noreply@inzozi.rw>"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== "production") {
      return;
    }

    if (!data.APP_URL.startsWith("https://")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "APP_URL must use HTTPS in production",
        path: ["APP_URL"],
      });
    }

    if (!data.API_URL.startsWith("https://")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "API_URL must use HTTPS in production",
        path: ["API_URL"],
      });
    }

    const secrets = [data.JWT_ACCESS_SECRET, data.JWT_REFRESH_SECRET, data.COOKIE_SECRET];
    for (const secret of secrets) {
      if (DEFAULT_SECRETS.includes(secret)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Default secrets must be replaced in production",
          path: ["JWT_ACCESS_SECRET"],
        });
        break;
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";

export function isGoogleOAuthEnabled(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim());
}

export function googleOAuthRedirectUri(): string {
  const base = isProduction ? env.API_URL : env.APP_URL;
  return `${base.replace(/\/$/, "")}/api/v1/auth/google/callback`;
}
