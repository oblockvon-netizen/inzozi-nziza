import { z } from "zod";

export const notificationQuerySchema = z.object({
  read: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  type: z.string().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
