import { RoutinesRepository } from "../infrastructure/routines.repository.js";
import { listRoutines } from "../application/list-routines.js";
import { getRoutine } from "../application/get-routine.js";
import { createRoutineSchema, addRoutineExerciseSchema } from "./routines.schemas.js";
import { ValidationError } from "../../../shared/errors/errors.js";

export async function routinesRoutes(fastify, { prisma }) {
  const repo = new RoutinesRepository(prisma);

  // GET /api/routines
  fastify.get("/api/routines", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    return reply.send(await listRoutines({ userId: req.user.id, repo }));
  });

  // GET /api/routines/:id
  fastify.get("/api/routines/:id", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    return reply.send(await getRoutine({ id: req.params.id, userId: req.user.id, repo }));
  });

  // POST /api/routines
  fastify.post("/api/routines", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const result = createRoutineSchema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.errors[0].message);
    return reply.status(201).send(await repo.create(req.user.id, result.data));
  });

  // PATCH /api/routines/:id
  fastify.patch("/api/routines/:id", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const result = createRoutineSchema.partial().safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.errors[0].message);
    return reply.send(await repo.update(req.params.id, req.user.id, result.data));
  });

  // DELETE /api/routines/:id — archive
  fastify.delete("/api/routines/:id", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    await repo.archive(req.params.id, req.user.id);
    return reply.status(204).send();
  });

  // POST /api/routines/:id/exercises — add exercise to routine
  fastify.post("/api/routines/:id/exercises", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const result = addRoutineExerciseSchema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.errors[0].message);

    const routine = await repo.findById(req.params.id, req.user.id);
    const entry = await prisma.routineExercise.create({
      data: { userId: req.user.id, routineId: routine.id, ...result.data },
    });
    return reply.status(201).send(entry);
  });
}

