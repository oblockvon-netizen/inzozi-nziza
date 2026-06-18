export type NotificationPriority = "high" | "medium" | "low";

const HIGH_TYPES = new Set([
  "FINE_ISSUED",
  "LOAN_DEFAULTED",
  "LOAN_PAYMENT_DUE",
  "MEMBER_REJECTED",
]);

const MEDIUM_TYPES = new Set([
  "LOAN_APPROVED",
  "LOAN_DENIED",
  "LOAN_SUBMITTED",
  "MEMBER_APPROVED",
  "CONTRIBUTION_RECORDED",
  "FINE_PAID",
  "FINE_CANCELLED",
]);

export function getNotificationPriority(type: string): NotificationPriority {
  if (HIGH_TYPES.has(type)) return "high";
  if (MEDIUM_TYPES.has(type)) return "medium";
  return "low";
}

export const priorityLabels: Record<NotificationPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const priorityStyles: Record<
  NotificationPriority,
  { badge: string; dot: string }
> = {
  high: {
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
  medium: {
    badge: "bg-gold/10 text-gold border-gold/20",
    dot: "bg-gold",
  },
  low: {
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

export function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Chrome")) return "Chrome browser";
  if (ua.includes("Firefox")) return "Firefox browser";
  return "Web browser";
}
