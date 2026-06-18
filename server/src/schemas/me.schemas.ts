import { z } from "zod";
import { sanitizeOptionalText, sanitizeText } from "../lib/sanitize.js";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).transform(sanitizeText),
  phone: z
    .string()
    .max(30)
    .optional()
    .transform((value) => (value ? sanitizeText(value) : undefined)),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
