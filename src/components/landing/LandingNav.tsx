import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#testimonials", label: "Testimonials" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0f1a]/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/30">
            <span className="text-sm font-bold text-accent">IN</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Inzozi Nziza
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/60 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className={cn("text-white/70 hover:text-white")} />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden text-white/70 hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            <Link to="/auth/login">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90"
          >
            <Link to="/auth/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
