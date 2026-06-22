import { evaluatePasswordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

const barColors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-gold",
  "bg-accent",
];

export function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, label, rules } = evaluatePasswordStrength(password);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i < score ? barColors[score - 1] : "bg-muted"
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "text-xs font-medium",
            score <= 1 && "text-red-500 dark:text-red-400",
            score === 2 && "text-gold",
            score >= 3 && "text-accent"
          )}
        >
          {label}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={cn(
              "text-xs transition-colors",
              rule.met ? "text-accent" : "text-muted-foreground"
            )}
          >
            {rule.met ? "✓" : "○"} {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
