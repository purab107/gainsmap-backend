import { progressionRoutes } from "./api/progression.routes.js";

export async function registerProgressionModule(fastify, deps) {
  await progressionRoutes(fastify, deps);
}

