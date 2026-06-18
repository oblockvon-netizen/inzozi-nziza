import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketingLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  backTo?: string;
  backLabel?: string;
}

export function MarketingLayout({
  children,
  showBack = false,
  backTo = "/",
  backLabel = "Home",
}: MarketingLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 mesh-gradient" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--accent)/0.08),transparent_50%)]" />

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {showBack && (
        <div className="absolute left-4 top-4 z-20">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link to={backTo}>
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}
