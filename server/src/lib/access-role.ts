import type { AppRole, MemberStatus } from "@prisma/client";
import type { AccessRole } from "../types/rbac.js";
import { permissionsForRole } from "../config/permissions.js";
import type { Permission } from "../types/rbac.js";

export function resolveAccessRole(input: {
  roles: AppRole[];
  isApproved: boolean;
  status: MemberStatus | string;
}): AccessRole {
  if (input.roles.includes("ADMIN")) {
    return "ADMIN";
  }

  if (input.isApproved && input.status === "ACTIVE") {
    return "USER";
  }

  return "PENDING_USER";
}

export function getPermissions(accessRole: AccessRole): readonly Permission[] {
  return permissionsForRole(accessRole);
}

export function hasPermission(
  accessRole: AccessRole,
  permission: Permission
): boolean {
  return permissionsForRole(accessRole).includes(permission);
}

export function hasAnyPermission(
  accessRole: AccessRole,
  permissions: Permission[]
): boolean {
  const granted = permissionsForRole(accessRole);
  return permissions.some((p) => granted.includes(p));
}

export function hasAllPermissions(
  accessRole: AccessRole,
  permissions: Permission[]
): boolean {
  const granted = permissionsForRole(accessRole);
  return permissions.every((p) => granted.includes(p));
}
