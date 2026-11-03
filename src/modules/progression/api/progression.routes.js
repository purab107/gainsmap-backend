import { ProgressionRepository } from "../infrastructure/progression.repository.js";

export async function progressionRoutes(fastify, { prisma }) {
  const repo = new ProgressionRepository(prisma);

  fastify.get("/api/progression", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    return reply.send(await repo.listForUser(req.user.id));
  });

  fastify.patch("/api/progression/:id/resolve", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { status, appliedWeightKg } = req.body ?? {};
    await repo.resolve(req.params.id, req.user.id, status, appliedWeightKg);
    return reply.status(204).send();
  });
}

