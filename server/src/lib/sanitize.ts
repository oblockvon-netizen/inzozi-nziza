const HTML_TAG_PATTERN = /<[^>]*>/g;
const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Strip HTML tags, control characters, and normalize whitespace. */
export function sanitizeText(value: string): string {
  return value
    .replace(CONTROL_CHARS_PATTERN, "")
    .replace(HTML_TAG_PATTERN, "")
    .trim()
    .replace(/\s+/g, " ");
}

/** Sanitize optional text fields; empty strings become undefined. */
export function sanitizeOptionalText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const sanitized = sanitizeText(value);
  return sanitized.length > 0 ? sanitized : undefined;
}

/** Sanitize email: lowercase, trim, strip tags. */
export function sanitizeEmail(value: string): string {
  return sanitizeText(value).toLowerCase();
}
