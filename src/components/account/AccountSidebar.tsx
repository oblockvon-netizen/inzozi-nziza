import { NavLink } from "react-router-dom";
import { User, Shield, Monitor, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/api";
import { Badge } from "@/components/ui/badge";

const links = [
  { to: "/profile", label: "Personal info", icon: User, end: true },
  { to: "/profile/security", label: "Security", icon: Shield },
  { to: "/profile/sessions", label: "Sessions", icon: Monitor },
  { to: "/profile/preferences", label: "Notifications", icon: Bell },
];

interface AccountSidebarProps {
  user: AuthUser;
}

export function AccountSidebar({ user }: AccountSidebarProps) {
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-lg font-bold text-accent">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.fullName}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {user.emailVerified && (
              <Badge variant="outline" className="text-xs">
                Verified
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs capitalize">
              {user.accessRole.toLowerCase().replace("_", " ")}
            </Badge>
          </div>
        </div>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
