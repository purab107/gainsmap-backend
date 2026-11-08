import { workoutsRoutes } from "./api/workouts.routes.js";

export async function registerWorkoutsModule(fastify, deps) {
  await workoutsRoutes(fastify, deps);
}

