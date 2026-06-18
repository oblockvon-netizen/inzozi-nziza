import { z } from "zod";

export const userIdParamSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export const loanIdParamSchema = z.object({
  loanId: z.string().uuid("Invalid loan ID"),
});

export const fineIdParamSchema = z.object({
  fineId: z.string().uuid("Invalid fine ID"),
});

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().max(100).optional(),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type LoanIdParam = z.infer<typeof loanIdParamSchema>;
export type FineIdParam = z.infer<typeof fineIdParamSchema>;
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
