import { z } from "zod";
import { sanitizeOptionalText, sanitizeText } from "../lib/sanitize.js";

export const approveMemberSchema = z.object({
  adminNotes: z.string().max(500).optional().transform(sanitizeOptionalText),
});

export const rejectMemberSchema = z.object({
  adminNotes: z.string().max(500).optional().transform(sanitizeOptionalText),
});

export const recordContributionSchema = z.object({
  userId: z.string().uuid(),
  amount: z.coerce.number().positive().max(100_000_000),
  paymentDate: z.coerce.date().optional(),
  referenceNumber: z
    .string()
    .max(100)
    .optional()
    .transform((value) => (value ? sanitizeText(value) : undefined)),
  notes: z.string().max(500).optional().transform(sanitizeOptionalText),
});

export const applyLoanSchema = z.object({
  amount: z.coerce.number().positive().max(50_000_000),
  purpose: z.string().min(3).max(1000).transform(sanitizeText),
});

export const loanDecisionSchema = z.object({
  adminNotes: z.string().max(1000).optional().transform(sanitizeOptionalText),
});

export const recordLoanPaymentSchema = z.object({
  amount: z.coerce.number().positive().max(50_000_000),
  notes: z.string().max(500).optional().transform(sanitizeOptionalText),
});

export const issueFineSchema = z.object({
  userId: z.string().uuid(),
  amount: z.coerce.number().positive().max(10_000_000),
  reason: z.string().min(3).max(1000).transform(sanitizeText),
  adminNotes: z.string().max(500).optional().transform(sanitizeOptionalText),
});

export const recordFinePaymentSchema = z.object({
  amount: z.coerce.number().positive().max(10_000_000),
  notes: z.string().max(500).optional().transform(sanitizeOptionalText),
});

export const cancelFineSchema = z.object({
  adminNotes: z.string().max(500).optional().transform(sanitizeOptionalText),
});

export type ApproveMemberInput = z.infer<typeof approveMemberSchema>;
export type RejectMemberInput = z.infer<typeof rejectMemberSchema>;
export type RecordContributionInput = z.infer<typeof recordContributionSchema>;
export type ApplyLoanInput = z.infer<typeof applyLoanSchema>;
export type LoanDecisionInput = z.infer<typeof loanDecisionSchema>;
export type RecordLoanPaymentInput = z.infer<typeof recordLoanPaymentSchema>;
export type IssueFineInput = z.infer<typeof issueFineSchema>;
export type RecordFinePaymentInput = z.infer<typeof recordFinePaymentSchema>;
export type CancelFineInput = z.infer<typeof cancelFineSchema>;
