import type { AccessRole } from "../types/rbac.js";
import { Permission } from "../types/rbac.js";

export const ROLE_PERMISSIONS: Record<AccessRole, readonly Permission[]> = {
  ADMIN: [
    Permission.VIEW_OWN_PROFILE,
    Permission.MANAGE_USERS,
    Permission.APPROVE_MEMBERS,
    Permission.VIEW_ALL_USERS,
    Permission.VIEW_ALL_CONTRIBUTIONS,
    Permission.RECORD_CONTRIBUTIONS,
    Permission.VIEW_ALL_LOANS,
    Permission.APPROVE_LOANS,
    Permission.DENY_LOANS,
    Permission.RECORD_LOAN_PAYMENTS,
    Permission.VIEW_ALL_FINES,
    Permission.ISSUE_FINES,
    Permission.RECORD_FINE_PAYMENTS,
    Permission.CANCEL_FINES,
  ],
  USER: [
    Permission.VIEW_OWN_PROFILE,
    Permission.VIEW_OWN_CONTRIBUTIONS,
    Permission.VIEW_OWN_CONTRIBUTION_SUMMARY,
    Permission.APPLY_LOAN,
    Permission.VIEW_OWN_LOANS,
    Permission.VIEW_OWN_FINES,
  ],
  PENDING_USER: [
    Permission.VIEW_OWN_PROFILE,
    Permission.VIEW_PENDING_STATUS,
  ],
};

export function permissionsForRole(role: AccessRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
