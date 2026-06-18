import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import helmet from "@fastify/helmet";
import { AppError } from "../utils/errors.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function registerSecurityHeaders(app: FastifyInstance): Promise<void> {
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return payload;
  });
}

export async function requireJsonContentType(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (!MUTATING_METHODS.has(request.method)) {
    return;
  }

  const contentLength = request.headers["content-length"];
  if (!contentLength || contentLength === "0") {
    return;
  }

  const contentType = request.headers["content-type"];
  if (!contentType?.includes("application/json")) {
    throw new AppError(415, "Content-Type must be application/json", "UNSUPPORTED_MEDIA_TYPE");
  }
}
