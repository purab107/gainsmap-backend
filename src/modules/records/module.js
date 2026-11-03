import { recordsRoutes } from "./api/records.routes.js";

export async function registerRecordsModule(fastify, deps) {
  await recordsRoutes(fastify, deps);
}

