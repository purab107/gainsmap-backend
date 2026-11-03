import { authRoutes } from "../../shared/http/plugins/auth.plugin.js";
import { identityRoutes } from "./api/me.routes.js";

/**
 * Registers the identity module with the Fastify app.
 * @param {import('fastify').FastifyInstance} fastify
 * @param {{ prisma: import('@prisma/client').PrismaClient }} deps
 */
export async function registerIdentityModule(fastify, deps) {
  await fastify.register(authRoutes);
  await identityRoutes(fastify, deps);
}

