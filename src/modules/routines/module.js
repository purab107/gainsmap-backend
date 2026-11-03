import { routinesRoutes } from "./api/routines.routes.js";

export async function registerRoutinesModule(fastify, deps) {
  await routinesRoutes(fastify, deps);
}

