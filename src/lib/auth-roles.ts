import type { AuthUser } from "@/types/api";

/** User has the ADMIN role in the database */
export function userIsAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.isAdmin ?? user.roles.includes("ADMIN");
}

/** User can use personal member features (own dashboard, loans, contributions) */
export function userIsMember(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.isMember !== undefined) return user.isMember;
  if (user.roles.includes("ADMIN")) return true;
  return user.roles.includes("USER") && user.isApproved && user.status === "ACTIVE";
}

export function userNavLabel(user: AuthUser | null | undefined): {
  admin: string;
  dashboard: string;
} {
  if (userIsAdmin(user)) {
    return {
      admin: "Operations",
      dashboard: "My dashboard",
    };
  }
  return {
    admin: "Admin",
    dashboard: "Dashboard",
  };
}
