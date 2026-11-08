import { WorkoutsRepository } from "../infrastructure/workouts.repository.js";
import { listWorkouts } from "../application/list-workouts.js";
import { getWorkout } from "../application/get-workout.js";
import { startWorkoutSchema, logSetSchema, addWorkoutExerciseSchema } from "./workouts.schemas.js";
import { ValidationError } from "../../../shared/errors/errors.js";

export async function workoutsRoutes(fastify, { prisma }) {
  const repo = new WorkoutsRepository(prisma);

  // GET /api/workouts
  fastify.get("/api/workouts", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    return reply.send(await listWorkouts({ userId: req.user.id, repo }));
  });

  // GET /api/workouts/active
  fastify.get("/api/workouts/active", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const active = await repo.findActiveWorkout(req.user.id);
    if (!active) return reply.status(204).send();
    return reply.send(active);
  });

  // GET /api/workouts/:id
  fastify.get("/api/workouts/:id", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    return reply.send(await getWorkout({ id: req.params.id, userId: req.user.id, repo }));
  });

  // POST /api/workouts — start new workout
  fastify.post("/api/workouts", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const result = startWorkoutSchema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.errors[0].message);
    return reply.status(201).send(await repo.start(req.user.id, result.data));
  });

  // POST /api/workouts/:id/finish
  fastify.post("/api/workouts/:id/finish", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    return reply.send(await repo.finish(req.params.id, req.user.id));
  });

  // POST /api/workouts/:id/exercises — add exercise to workout
  fastify.post("/api/workouts/:id/exercises", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const result = addWorkoutExerciseSchema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.errors[0].message);

    const workout = await repo.findById(req.params.id, req.user.id);
    const we = await prisma.workoutExercise.create({
      data: { userId: req.user.id, workoutId: workout.id, ...result.data },
    });
    return reply.status(201).send(we);
  });

  // POST /api/workout-exercises/:weId/sets — log a set
  fastify.post("/api/workout-exercises/:weId/sets", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const result = logSetSchema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.errors[0].message);
    const set = await repo.logSet(req.params.weId, req.user.id, result.data);
    return reply.status(201).send(set);
  });

  // GET /api/exercises/:exerciseId/history — previous performance
  fastify.get("/api/exercises/:exerciseId/history", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const limit = Number(req.query.limit) || 5;
    return reply.send(await repo.getPreviousPerformance(req.user.id, req.params.exerciseId, limit));
  });
}

