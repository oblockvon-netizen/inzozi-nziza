import type { FastifyInstance } from "fastify";
import { validateBody } from "../middleware/validate.js";
import {
  memberContributions,
  adminContributions,
  adminRecordContribution,
} from "../middleware/guards.js";
import { recordContributionSchema } from "../schemas/domain.schemas.js";
import {
  listOwnContributions,
  getContributionSummary,
  listAllContributions,
  recordContribution,
} from "../services/contribution.service.js";
import { adminRateLimits } from "../middleware/rateLimit.js";

export async function contributionRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/mine",
    { preHandler: memberContributions },
    async (request, reply) => {
      const contributions = await listOwnContributions(request.authUser!.id);
      return reply.send({ contributions });
    }
  );

  app.get(
    "/mine/summary",
    { preHandler: memberContributions },
    async (request, reply) => {
      const summary = await getContributionSummary(request.authUser!.id);
      return reply.send({ summary });
    }
  );

  app.get(
    "/",
    { preHandler: adminContributions },
    async (_request, reply) => {
      const contributions = await listAllContributions();
      return reply.send({ contributions });
    }
  );

  app.post(
    "/",
    {
      ...adminRateLimits.mutations,
      preHandler: adminRecordContribution,
      preValidation: [validateBody(recordContributionSchema)],
    },
    async (request, reply) => {
      const contribution = await recordContribution(
        request.authUser!.id,
        request.body as {
          userId: string;
          amount: number;
          paymentDate?: Date;
          referenceNumber?: string;
          notes?: string;
        },
        request
      );
      return reply.status(201).send({ contribution, message: "Contribution recorded" });
    }
  );
}
