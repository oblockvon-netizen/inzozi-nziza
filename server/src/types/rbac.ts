export type AccessRole = "ADMIN" | "USER" | "PENDING_USER";

export const Permission = {
  VIEW_OWN_PROFILE: "view:own_profile",
  VIEW_PENDING_STATUS: "view:pending_status",

  VIEW_OWN_CONTRIBUTIONS: "view:own_contributions",
  VIEW_OWN_CONTRIBUTION_SUMMARY: "view:own_contribution_summary",

  APPLY_LOAN: "apply:loan",
  VIEW_OWN_LOANS: "view:own_loans",

  VIEW_OWN_FINES: "view:own_fines",

  MANAGE_USERS: "admin:manage_users",
  APPROVE_MEMBERS: "admin:approve_members",
  VIEW_ALL_USERS: "admin:view_users",

  VIEW_ALL_CONTRIBUTIONS: "admin:view_contributions",
  RECORD_CONTRIBUTIONS: "admin:record_contributions",

  VIEW_ALL_LOANS: "admin:view_loans",
  APPROVE_LOANS: "admin:approve_loans",
  DENY_LOANS: "admin:deny_loans",
  RECORD_LOAN_PAYMENTS: "admin:record_loan_payments",

  VIEW_ALL_FINES: "admin:view_fines",
  ISSUE_FINES: "admin:issue_fines",
  RECORD_FINE_PAYMENTS: "admin:record_fine_payments",
  CANCEL_FINES: "admin:cancel_fines",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const AuditAction = {
  MEMBER_APPROVED: "member.approved",
  MEMBER_REJECTED: "member.rejected",
  CONTRIBUTION_RECORDED: "contribution.recorded",
  LOAN_APPLICATION_CREATED: "loan.application_created",
  LOAN_APPROVED: "loan.approved",
  LOAN_DENIED: "loan.denied",
  LOAN_PAYMENT_RECORDED: "loan.payment.recorded",
  FINE_ISSUED: "fine.issued",
  FINE_PAYMENT_RECORDED: "fine.payment.recorded",
  FINE_CANCELLED: "fine.cancelled",
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
