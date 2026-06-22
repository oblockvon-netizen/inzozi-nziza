/** Rwanda mobile: +250 7XX XXX XXX */
const RWANDA_PHONE_PATTERN = /^(?:\+?250|0)?(7[2-9]\d{7})$/;

export function normalizeRwandaPhone(value: string): string | undefined {
  const cleaned = value.replace(/[\s\-()]/g, "");
  if (!cleaned) return undefined;

  const match = cleaned.match(RWANDA_PHONE_PATTERN);
  if (!match) return undefined;

  return `+250${match[1]}`;
}

export function rwandaPhoneSchemaOptional() {
  return {
    refine: (value: string | undefined) => {
      if (!value || !value.trim()) return true;
      return normalizeRwandaPhone(value) !== undefined;
    },
    message: "Enter a valid Rwanda phone number (e.g. +250788123456 or 0788123456)",
  };
}

export function transformRwandaPhone(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return normalizeRwandaPhone(value);
}
