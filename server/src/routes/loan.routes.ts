import type { FastifyInstance } from "fastify";
import { validateBody, validateParams } from "../middleware/validate.js";
import {
  memberLoans,
  memberApplyLoan,
  adminLoans,
  adminApproveLoan,
  adminDenyLoan,
  adminRecordLoanPayment,
} from "../middleware/guards.js";
import {
  applyLoanSchema,
  loanDecisionSchema,
  recordLoanPaymentSchema,
} from "../schemas/domain.schemas.js";
import {
  listOwnLoans,
  listAllLoans,
  getLoan,
  applyForLoan,
  approveLoan,
  denyLoan,
  recordLoanPayment,
} from "../services/loan.service.js";
import { adminRateLimits, memberRateLimits } from "../middleware/rateLimit.js";
import { loanIdParamSchema } from "../schemas/params.schemas.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAnyPermission } from "../middleware/permissions.js";
import { Permission } from "../types/rbac.js";

export async function loanRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/mine",
    { preHandler: memberLoans },
    async (request, reply) => {
      const loans = await listOwnLoans(request.authUser!.id);
      return reply.send({ loans });
    }
  );

  app.post(
    "/mine",
    {
      ...memberRateLimits.applyLoan,
      preHandler: memberApplyLoan,
      preValidation: [validateBody(applyLoanSchema)],
    },
    async (request, reply) => {
      const loan = await applyForLoan(
        request.authUser!.id,
        request.body as { amount: number; purpose: string },
        request
      );
      return reply.status(201).send({ loan, message: "Loan application submitted" });
    }
  );

  app.get(
    "/",
    { preHandler: adminLoans },
    async (_request, reply) => {
      const loans = await listAllLoans();
      return reply.send({ loans });
    }
  );

  app.get(
    "/:loanId",
    {
      preValidation: [validateParams(loanIdParamSchema)],
      preHandler: [
        requireAuth,
        requireAnyPermission(Permission.VIEW_ALL_LOANS, Permission.VIEW_OWN_LOANS),
      ],
    },
    async (request, reply) => {
      const { loanId } = request.params as { loanId: string };
      const isAdmin = request.authUser!.accessRole === "ADMIN";
      const loan = await getLoan(loanId, request.authUser!.id, isAdmin);
      return reply.send({ loan });
    }
  );

  app.post(
    "/:loanId/approve",
    {
      ...adminRateLimits.mutations,
      preHandler: adminApproveLoan,
      preValidation: [validateParams(loanIdParamSchema), validateBody(loanDecisionSchema)],
    },
    async (request, reply) => {
      const { loanId } = request.params as { loanId: string };
      const loan = await approveLoan(
        request.authUser!.id,
        loanId,
        request.body as { adminNotes?: string },
        request
      );
      return reply.send({ loan, message: "Loan approved" });
    }
  );

  app.post(
    "/:loanId/deny",
    {
      ...adminRateLimits.mutations,
      preHandler: adminDenyLoan,
      preValidation: [validateParams(loanIdParamSchema), validateBody(loanDecisionSchema)],
    },
    async (request, reply) => {
      const { loanId } = request.params as { loanId: string };
      const loan = await denyLoan(
        request.authUser!.id,
        loanId,
        request.body as { adminNotes?: string },
        request
      );
      return reply.send({ loan, message: "Loan denied" });
    }
  );

  app.post(
    "/:loanId/payments",
    {
      ...adminRateLimits.mutations,
      preHandler: adminRecordLoanPayment,
      preValidation: [validateParams(loanIdParamSchema), validateBody(recordLoanPaymentSchema)],
    },
    async (request, reply) => {
      const { loanId } = request.params as { loanId: string };
      const result = await recordLoanPayment(
        request.authUser!.id,
        loanId,
        request.body as { amount: number; notes?: string },
        request
      );
      return reply.status(201).send({
        loan: result.updatedLoan,
        payment: result.loanPayment,
        message: "Loan payment recorded",
      });
    }
  );
}
