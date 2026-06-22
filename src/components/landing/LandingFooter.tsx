import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="container py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
                <span className="text-xs font-bold text-accent">IN</span>
              </div>
              <span className="font-semibold text-foreground">Inzozi Nziza</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Community savings and loans for Rwanda — transparent contributions,
              accountable lending, admin-managed growth.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Product
              </p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">
                    How it works
                  </a>
                </li>
                <li>
                  <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Community
              </p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground">
                    Testimonials
                  </a>
                </li>
                <li>
                  <Link to="/auth/signup" className="text-sm text-muted-foreground hover:text-foreground">
                    Get started
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Inzozi Nziza. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for Rwanda · Secure · Admin-approved membership
          </p>
        </div>
      </div>
    </footer>
  );
}
