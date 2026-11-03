import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { config } from "../shared/config/config.js";
import { logger } from "../shared/logging/logger.js";
import { prisma } from "../shared/db/prisma.js";
import { authPlugin } from "../shared/http/plugins/auth.plugin.js";
import { registerIdentityModule } from "../modules/identity/module.js";
import { registerExercisesModule } from "../modules/exercises/module.js";
import { registerRoutinesModule } from "../modules/routines/module.js";
import { registerWorkoutsModule } from "../modules/workouts/module.js";
import { registerProgressionModule } from "../modules/progression/module.js";
import { registerRecordsModule } from "../modules/records/module.js";
import { AppError } from "../shared/errors/errors.js";

export async function buildApp() {
  const app = Fastify({
    logger,
    disableRequestLogging: false,
  });

  // ── Security & CORS ────────────────────────────────────────────────────────
  await app.register(helmet);
  await app.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 200,
    timeWindow: "1 minute",
  });

  // ── Auth decorator (adds fastify.authenticate) ─────────────────────────────
  await app.register(authPlugin);

  // ── Shared error handler ───────────────────────────────────────────────────
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
    }
    app.log.error(error);
    return reply.status(500).send({ error: "INTERNAL_ERROR", message: "An unexpected error occurred" });
  });

  // ── Health check ───────────────────────────────────────────────────────────
  app.get("/health", async () => ({ status: "ok" }));

  // ── Modules ────────────────────────────────────────────────────────────────
  const deps = { prisma };
  await registerIdentityModule(app, deps);
  await registerExercisesModule(app, deps);
  await registerRoutinesModule(app, deps);
  await registerWorkoutsModule(app, deps);
  await registerProgressionModule(app, deps);
  await registerRecordsModule(app, deps);

  return app;
}
