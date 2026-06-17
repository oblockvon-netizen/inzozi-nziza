import { z } from "zod";

export const approveMemberSchema = z.object({
  adminNotes: z.string().max(500).optional(),
});

export const rejectMemberSchema = z.object({
  adminNotes: z.string().max(500).optional(),
});

export const recordContributionSchema = z.object({
  userId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  paymentDate: z.coerce.date().optional(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const applyLoanSchema = z.object({
  amount: z.coerce.number().positive(),
  purpose: z.string().min(3).max(1000).trim(),
});

export const loanDecisionSchema = z.object({
  adminNotes: z.string().max(1000).optional(),
});

export const recordLoanPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  notes: z.string().max(500).optional(),
});

export const issueFineSchema = z.object({
  userId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  reason: z.string().min(3).max(1000).trim(),
  adminNotes: z.string().max(500).optional(),
});

export const recordFinePaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  notes: z.string().max(500).optional(),
});

export const cancelFineSchema = z.object({
  adminNotes: z.string().max(500).optional(),
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
