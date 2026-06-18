import type { ReactNode } from "react";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { Separator } from "@/components/ui/separator";

interface AuthFormShellProps {
  children: ReactNode;
  showGoogle?: boolean;
}

export function AuthFormShell({ children, showGoogle = true }: AuthFormShellProps) {
  return (
    <div className="space-y-6">
      {showGoogle && (
        <>
          <GoogleAuthButton />
          <div className="relative">
            <Separator className="bg-white/10" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#111827] px-3 text-xs text-white/40">
              or continue with email
            </span>
          </div>
        </>
      )}
      {children}
    </div>
  );
}
