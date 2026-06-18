export interface NotificationPreferences {
  contributions: boolean;
  loans: boolean;
  fines: boolean;
  membership: boolean;
  system: boolean;
  emailDigest: boolean;
}

const STORAGE_KEY = "inzozi_notification_prefs";

const defaults: NotificationPreferences = {
  contributions: true,
  loans: true,
  fines: true,
  membership: true,
  system: true,
  emailDigest: false,
};

export function loadNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function shouldShowNotificationType(
  type: string,
  prefs: NotificationPreferences
): boolean {
  if (type.includes("CONTRIBUTION")) return prefs.contributions;
  if (type.includes("LOAN")) return prefs.loans;
  if (type.includes("FINE")) return prefs.fines;
  if (type.includes("MEMBER")) return prefs.membership;
  return prefs.system;
}
