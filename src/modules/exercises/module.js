import { exercisesRoutes } from "./api/exercises.routes.js";

export async function registerExercisesModule(fastify, deps) {
  await exercisesRoutes(fastify, deps);
}

