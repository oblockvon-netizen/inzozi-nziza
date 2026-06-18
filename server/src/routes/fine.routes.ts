import type { FastifyInstance } from "fastify";
import { validateBody, validateParams } from "../middleware/validate.js";
import {
  memberFines,
  adminFines,
  adminIssueFine,
  adminRecordFinePayment,
  adminCancelFine,
} from "../middleware/guards.js";
import {
  issueFineSchema,
  recordFinePaymentSchema,
  cancelFineSchema,
} from "../schemas/domain.schemas.js";
import { adminRateLimits } from "../middleware/rateLimit.js";
import { fineIdParamSchema } from "../schemas/params.schemas.js";
import {
  listOwnFines,
  listAllFines,
  issueFine,
  recordFinePayment,
  cancelFine,
} from "../services/fine.service.js";

export async function fineRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/mine",
    { preHandler: memberFines },
    async (request, reply) => {
      const fines = await listOwnFines(request.authUser!.id);
      return reply.send({ fines });
    }
  );

  app.get(
    "/",
    { preHandler: adminFines },
    async (_request, reply) => {
      const fines = await listAllFines();
      return reply.send({ fines });
    }
  );

  app.post(
    "/",
    {
      ...adminRateLimits.mutations,
      preHandler: adminIssueFine,
      preValidation: [validateBody(issueFineSchema)],
    },
    async (request, reply) => {
      const fine = await issueFine(
        request.authUser!.id,
        request.body as {
          userId: string;
          amount: number;
          reason: string;
          adminNotes?: string;
        },
        request
      );
      return reply.status(201).send({ fine, message: "Fine issued" });
    }
  );

  app.post(
    "/:fineId/payments",
    {
      ...adminRateLimits.mutations,
      preHandler: adminRecordFinePayment,
      preValidation: [validateParams(fineIdParamSchema), validateBody(recordFinePaymentSchema)],
    },
    async (request, reply) => {
      const { fineId } = request.params as { fineId: string };
      const result = await recordFinePayment(
        request.authUser!.id,
        fineId,
        request.body as { amount: number; notes?: string },
        request
      );
      return reply.status(201).send({
        fine: result.updatedFine,
        payment: result.payment,
        message: "Fine payment recorded",
      });
    }
  );

  app.post(
    "/:fineId/cancel",
    {
      ...adminRateLimits.mutations,
      preHandler: adminCancelFine,
      preValidation: [validateParams(fineIdParamSchema), validateBody(cancelFineSchema)],
    },
    async (request, reply) => {
      const { fineId } = request.params as { fineId: string };
      const fine = await cancelFine(
        request.authUser!.id,
        fineId,
        request.body as { adminNotes?: string },
        request
      );
      return reply.send({ fine, message: "Fine cancelled" });
    }
  );
}
