/**
 * Rwanda mobile numbers: +250 7XX XXX XXX (9 digits after country code).
 * Accepts: +250788123456, 250788123456, 0788123456, 788123456
 */
const RWANDA_PHONE_PATTERN = /^(?:\+?250|0)?(7[2-9]\d{7})$/;

export function normalizeRwandaPhone(value: string): string | undefined {
  const cleaned = value.replace(/[\s\-()]/g, "");
  if (!cleaned) return undefined;

  const match = cleaned.match(RWANDA_PHONE_PATTERN);
  if (!match) return undefined;

  return `+250${match[1]}`;
}

export function isValidRwandaPhone(value: string): boolean {
  if (!value.trim()) return true;
  return normalizeRwandaPhone(value) !== undefined;
}

export const RWANDA_PHONE_HINT = "Use a valid Rwanda number, e.g. +250 788 123 456 or 0788 123 456";

export const RWANDA_PHONE_ERROR = "Enter a valid Rwanda phone number (9 digits starting with 7)";
