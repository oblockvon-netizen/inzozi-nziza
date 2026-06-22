import type { FastifyReply, FastifyRequest } from "fastify";

import { requireAuth, requireEmailVerified } from "./auth.js";

import { requireAccessRole } from "./role.js";

import { requirePermission } from "./permissions.js";

import { Permission } from "../types/rbac.js";



type PreHandler = (

  request: FastifyRequest,

  reply: import("fastify").FastifyReply

) => Promise<void>;



async function requireEmailVerifiedForMembers(

  request: FastifyRequest,

  reply: FastifyReply

): Promise<void> {

  if (request.authUser?.accessRole === "ADMIN") {

    return;

  }

  await requireEmailVerified(request, reply);

}



export const authenticated: PreHandler[] = [requireAuth];



export const pendingUser: PreHandler[] = [

  requireAuth,

  requireAccessRole("PENDING_USER"),

];



export const activeMember: PreHandler[] = [

  requireAuth,

  requireEmailVerifiedForMembers,

  requireAccessRole("USER", "ADMIN"),

];



export const adminOnly: PreHandler[] = [

  requireAuth,

  requireAccessRole("ADMIN"),

];



export const profileUpdate: PreHandler[] = [

  requireAuth,

  requireAccessRole("ADMIN", "USER", "PENDING_USER"),

  requirePermission(Permission.VIEW_OWN_PROFILE),

];



export const adminManageUsers: PreHandler[] = [

  ...adminOnly,

  requirePermission(Permission.VIEW_ALL_USERS, Permission.MANAGE_USERS),

];



export const adminApproveMembers: PreHandler[] = [

  ...adminOnly,

  requirePermission(Permission.APPROVE_MEMBERS),

];



export const adminContributions: PreHandler[] = [

  ...adminOnly,

  requirePermission(Permission.VIEW_ALL_CONTRIBUTIONS),

];



export const adminRecordContribution: PreHandler[] = [

  ...adminOnly,

  requirePermission(Permission.RECORD_CONTRIBUTIONS),

];



export const adminLoans: PreHandler[] = [

  ...adminOnly,

  requirePermission(Permission.VIEW_ALL_LOANS),

];



export const adminApproveLoan: PreHandler[] = [

  ...adminOnly,

  requirePermission(Permission.APPROVE_LOANS),

];



export const adminDenyLoan: PreHandler[] = [

  ...adminOnly,

  requirePermission(Permission.DENY_LOANS),

];



export const adminRecordLoanPayment: PreHandler[] = [

  ...adminOnly,

  requirePermission(Permission.RECORD_LOAN_PAYMENTS),

];



export const adminFines: PreHandler[] = [

  ...adminOnly,

  requirePermission(Permission.VIEW_ALL_FINES),

];



export const adminIssueFine: PreHandler[] = [

  ...adminOnly,

  requirePermission(Permission.ISSUE_FINES),

];



export const adminRecordFinePayment: PreHandler[] = [

  ...adminOnly,

  requirePermission(Permission.RECORD_FINE_PAYMENTS),

];



export const adminCancelFine: PreHandler[] = [

  ...adminOnly,

  requirePermission(Permission.CANCEL_FINES),

];



export const memberContributions: PreHandler[] = [

  ...activeMember,

  requirePermission(Permission.VIEW_OWN_CONTRIBUTIONS),

];



export const memberLoans: PreHandler[] = [

  ...activeMember,

  requirePermission(Permission.VIEW_OWN_LOANS),

];



export const memberApplyLoan: PreHandler[] = [

  ...activeMember,

  requirePermission(Permission.APPLY_LOAN),

];



export const memberFines: PreHandler[] = [

  ...activeMember,

  requirePermission(Permission.VIEW_OWN_FINES),

];


