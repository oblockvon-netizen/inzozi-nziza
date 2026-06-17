import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { env, isProduction } from "./config/env.js";
import { registerRateLimiting } from "./middleware/rateLimit.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/validate.js";
import { authRoutes } from "./routes/auth.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: !isProduction,
    trustProxy: true,
  });

  await app.register(cors, {
    origin: env.APP_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: "onRequest",
  });

  await registerRateLimiting(app);

  app.addHook("preHandler", csrfProtection);
  app.setErrorHandler(errorHandler);

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes, { prefix: "/api/v1/auth" });

  return app;
}
