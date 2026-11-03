import { getCurrentUser } from "../application/get-me.js";
import { IdentityRepository } from "../infrastructure/identity.repository.js";
import { updateSettingsSchema } from "./identity.schemas.js";
import { ValidationError } from "../../../shared/errors/errors.js";

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {{ prisma: import('@prisma/client').PrismaClient }} opts
 */
export async function identityRoutes(fastify, { prisma }) {
  const repo = new IdentityRepository(prisma);

  // GET /api/me — current user profile + settings
  fastify.get(
    "/api/me",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await getCurrentUser({ userId: request.user.id, repo });
      return reply.send(user);
    }
  );

  // PATCH /api/me/settings — update preferences
  fastify.patch(
    "/api/me/settings",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const result = updateSettingsSchema.safeParse(request.body);
      if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
      }
      const updated = await repo.upsertSettings(request.user.id, result.data);
      return reply.send(updated);
    }
  );

  // DELETE /api/me — soft-delete account
  fastify.delete(
    "/api/me",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      await repo.softDelete(request.user.id);
      return reply.status(204).send();
    }
  );
}

