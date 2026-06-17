import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { env, isProduction } from "./config/env.js";
import { registerRateLimiting } from "./middleware/rateLimit.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/validate.js";
import { authRoutes } from "./routes/auth.routes.js";
import { adminRoutes } from "./routes/admin.routes.js";
import { contributionRoutes } from "./routes/contribution.routes.js";
import { loanRoutes } from "./routes/loan.routes.js";
import { fineRoutes } from "./routes/fine.routes.js";
import { meRoutes } from "./routes/me.routes.js";

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
  await app.register(adminRoutes, { prefix: "/api/v1/admin" });
  await app.register(contributionRoutes, { prefix: "/api/v1/contributions" });
  await app.register(loanRoutes, { prefix: "/api/v1/loans" });
  await app.register(fineRoutes, { prefix: "/api/v1/fines" });
  await app.register(meRoutes, { prefix: "/api/v1/me" });

  return app;
}
