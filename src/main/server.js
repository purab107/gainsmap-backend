import "dotenv/config";
import { buildApp } from "./app.js";
import { config } from "../shared/config/config.js";
import { prisma } from "../shared/db/prisma.js";
import { logger } from "../shared/logging/logger.js";

const app = await buildApp();

const shutdown = async (signal) => {
  logger.info({ signal }, "Shutting down...");
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

try {
  await app.listen({ port: config.PORT, host: config.HOST });
  logger.info(`🚀 GainsMap API listening on http://${config.HOST}:${config.PORT}`);
} catch (err) {
  logger.error(err);
  process.exit(1);
}

