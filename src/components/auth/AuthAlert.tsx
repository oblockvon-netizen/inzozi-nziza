import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthAlertVariant = "error" | "success" | "info";

const config: Record<
  AuthAlertVariant,
  { icon: typeof AlertCircle; className: string }
> = {
  error: {
    icon: AlertCircle,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  success: {
    icon: CheckCircle2,
    className: "border-accent/30 bg-accent/10 text-accent",
  },
  info: {
    icon: Info,
    className: "border-gold/30 bg-gold/10 text-gold",
  },
};

interface AuthAlertProps {
  variant: AuthAlertVariant;
  title?: string;
  message: string;
  className?: string;
}

export function AuthAlert({ variant, title, message, className }: AuthAlertProps) {
  const { icon: Icon, className: variantClass } = config[variant];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        role="alert"
        aria-live="polite"
        className={cn(
          "flex gap-3 rounded-xl border px-4 py-3 text-sm",
          variantClass,
          className
        )}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          {title && <p className="font-medium">{title}</p>}
          <p className={title ? "mt-0.5 opacity-90" : ""}>{message}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
