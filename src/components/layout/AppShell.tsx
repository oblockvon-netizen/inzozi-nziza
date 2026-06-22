import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shield,
  User,
  LogOut,
  Menu,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { userIsAdmin, userNavLabel } from "@/lib/auth-roles";
import { Badge } from "@/components/ui/badge";

interface AppShellProps {
  title: string;
  subtitle?: string;
  variant?: "member" | "admin";
  onSignOut?: () => void;
  children: ReactNode;
}

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
};

function buildMemberNav(dashboardLabel: string): NavItem[] {
  return [
    { href: "/dashboard", label: dashboardLabel, icon: LayoutDashboard },
    { href: "/notifications", label: "Notifications", icon: Bell, badge: true },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
  ];
}

function buildNav(variant: "member" | "admin", isAdmin: boolean, labels: ReturnType<typeof userNavLabel>): NavItem[] {
  if (variant === "admin") {
    return [
      { href: "/admin", label: labels.admin, icon: Shield },
      { href: "/dashboard", label: labels.dashboard, icon: LayoutDashboard },
    ];
  }

  if (isAdmin) {
    return [
      { href: "/admin", label: labels.admin, icon: Shield },
      ...buildMemberNav(labels.dashboard),
    ];
  }

  return buildMemberNav(labels.dashboard);
}

function NavLinks({
  nav,
  pathname,
  onNavigate,
  className,
  unreadCount = 0,
}: {
  nav: NavItem[];
  pathname: string;
  onNavigate?: () => void;
  className?: string;
  unreadCount?: number;
}) {
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {nav.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const showBadge = item.badge && unreadCount > 0;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
            {showBadge && (
              <Badge className="ml-auto h-5 min-w-5 justify-center bg-accent px-1.5 text-[10px] text-accent-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  title,
  subtitle,
  variant = "member",
  onSignOut,
  children,
}: AppShellProps) {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = userIsAdmin(user);
  const labels = userNavLabel(user);
  const nav = buildNav(variant, isAdmin, labels);
  const { unreadCount } = useNotifications();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-accent">
              Inzozi Nziza
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <nav className="mr-2 hidden items-center gap-1 md:flex" aria-label="Main navigation">
              <NavLinks nav={nav} pathname={location.pathname} className="flex-row gap-1" unreadCount={unreadCount} />
            </nav>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="text-left">Navigation</SheetTitle>
                </SheetHeader>
                <NavLinks
                  nav={nav}
                  pathname={location.pathname}
                  className="mt-6"
                  unreadCount={unreadCount}
                />
                {onSignOut && (
                  <Button
                    onClick={onSignOut}
                    variant="outline"
                    className="mt-6 w-full gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                )}
              </SheetContent>
            </Sheet>

            <ThemeToggle />
            {onSignOut && (
              <Button
                onClick={onSignOut}
                variant="outline"
                size="sm"
                className="hidden gap-2 md:inline-flex"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto max-w-7xl px-4 py-8 outline-none sm:px-6 lg:px-8"
      >
        {children}
      </main>
    </div>
  );
}
