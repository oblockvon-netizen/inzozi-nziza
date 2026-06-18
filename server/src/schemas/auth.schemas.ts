import { z } from "zod";
import { sanitizeEmail, sanitizeOptionalText, sanitizeText } from "../lib/sanitize.js";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const signupSchema = z.object({
  email: z.string().email().max(255).transform(sanitizeEmail),
  password: passwordSchema,
  fullName: z.string().min(2).max(120).transform(sanitizeText),
  phone: z
    .string()
    .max(30)
    .optional()
    .transform((value) => (value ? sanitizeText(value) : undefined)),
});

export const loginSchema = z.object({
  email: z.string().email().max(255).transform(sanitizeEmail),
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(255).transform(sanitizeEmail),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(512),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1).max(512),
});

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .email()
    .max(255)
    .transform(sanitizeEmail)
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
