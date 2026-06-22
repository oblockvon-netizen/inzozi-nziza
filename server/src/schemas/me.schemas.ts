import { z } from "zod";
import { sanitizeOptionalText, sanitizeText } from "../lib/sanitize.js";
import { normalizeRwandaPhone } from "../lib/phone.js";

const phoneField = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined) return null;
    if (!value.trim()) return null;
    const normalized = normalizeRwandaPhone(value);
    if (!normalized) {
      throw new z.ZodError([
        {
          code: "custom",
          message: "Enter a valid Rwanda phone number (e.g. +250788123456 or 0788123456)",
          path: ["phone"],
        },
      ]);
    }
    return normalized;
  });

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(120).transform(sanitizeText),
  phone: phoneField,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
