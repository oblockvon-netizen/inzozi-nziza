import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodType, ZodTypeDef } from "zod";
import { AppError } from "../utils/errors.js";

export function validateBody<T>(schema: ZodType<T, ZodTypeDef, unknown>) {
  return async (request: FastifyRequest): Promise<void> => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      throw new AppError(400, result.error.errors[0]?.message ?? "Invalid request body", "VALIDATION_ERROR");
    }
    request.body = result.data;
  };
}

export function validateQuery<T>(schema: ZodType<T, ZodTypeDef, unknown>) {
  return async (request: FastifyRequest): Promise<void> => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      throw new AppError(400, result.error.errors[0]?.message ?? "Invalid query", "VALIDATION_ERROR");
    }
    request.query = result.data;
  };
}

export function validateParams<T>(schema: ZodType<T, ZodTypeDef, unknown>) {
  return async (request: FastifyRequest): Promise<void> => {
    const result = schema.safeParse(request.params);
    if (!result.success) {
      throw new AppError(400, result.error.errors[0]?.message ?? "Invalid route parameters", "VALIDATION_ERROR");
    }
    request.params = result.data;
  };
}

export function errorHandler(
  error: Error & { statusCode?: number; code?: string },
  _request: FastifyRequest,
  reply: FastifyReply
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: error.code ?? "APP_ERROR",
      message: error.message,
    });
    return;
  }

  if (error.name === "ZodError") {
    reply.status(400).send({ error: "VALIDATION_ERROR", message: "Invalid request" });
    return;
  }

  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    reply.status(401).send({ error: "INVALID_TOKEN", message: "Invalid or expired token" });
    return;
  }

  console.error(error);
  reply.status(500).send({ error: "INTERNAL_ERROR", message: "An unexpected error occurred" });
}
