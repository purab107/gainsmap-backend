import { RecordsRepository } from "../infrastructure/records.repository.js";

export async function recordsRoutes(fastify, { prisma }) {
  const repo = new RecordsRepository(prisma);

  fastify.get("/api/records", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    return reply.send(await repo.listForUser(req.user.id));
  });

  fastify.get("/api/exercises/:exerciseId/records", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    return reply.send(await repo.findForExercise(req.user.id, req.params.exerciseId));
  });
}

