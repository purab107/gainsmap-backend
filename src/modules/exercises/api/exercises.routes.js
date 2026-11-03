import { ExercisesRepository } from "../infrastructure/exercises.repository.js";
import { getExercise } from "../application/get-exercise.js";
import { searchExercises } from "../application/search-exercises.js";
import { exerciseListQuerySchema, createExerciseSchema } from "./exercises.schemas.js";
import { ValidationError } from "../../../shared/errors/errors.js";

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {{ prisma: import('@prisma/client').PrismaClient }} opts
 */
export async function exercisesRoutes(fastify, { prisma }) {
  const repo = new ExercisesRepository(prisma);

  // GET /api/exercises — search & filter
  fastify.get(
    "/api/exercises",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const result = exerciseListQuerySchema.safeParse(request.query);
      if (!result.success) throw new ValidationError(result.error.errors[0].message);
      const exercises = await searchExercises({ userId: request.user.id, filters: result.data, repo });
      return reply.send(exercises);
    }
  );

  // GET /api/exercises/:id — single exercise detail
  fastify.get(
    "/api/exercises/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const exercise = await getExercise({ id: request.params.id, userId: request.user.id, repo });
      return reply.send(exercise);
    }
  );

  // POST /api/exercises — create custom exercise
  fastify.post(
    "/api/exercises",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const result = createExerciseSchema.safeParse(request.body);
      if (!result.success) throw new ValidationError(result.error.errors[0].message);
      const exercise = await repo.create(request.user.id, result.data);
      return reply.status(201).send(exercise);
    }
  );

  // PATCH /api/exercises/:id — update custom exercise
  fastify.patch(
    "/api/exercises/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const exercise = await repo.update(request.params.id, request.user.id, request.body);
      return reply.send(exercise);
    }
  );

  // DELETE /api/exercises/:id — delete custom exercise
  fastify.delete(
    "/api/exercises/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      await repo.delete(request.params.id, request.user.id);
      return reply.status(204).send();
    }
  );
}
