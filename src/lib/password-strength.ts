export interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordStrength {
  score: number;
  label: "Weak" | "Fair" | "Good" | "Strong";
  rules: PasswordRule[];
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const rules: PasswordRule[] = [
    { id: "length", label: "At least 8 characters", met: password.length >= 8 },
    { id: "lower", label: "One lowercase letter", met: /[a-z]/.test(password) },
    { id: "upper", label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { id: "number", label: "One number", met: /[0-9]/.test(password) },
  ];

  const score = rules.filter((r) => r.met).length;

  const labelMap: Record<number, PasswordStrength["label"]> = {
    0: "Weak",
    1: "Weak",
    2: "Fair",
    3: "Good",
    4: "Strong",
  };

  return { score, label: labelMap[score], rules };
}

export function passwordsMatch(a: string, b: string): boolean {
  return a.length > 0 && a === b;
}
