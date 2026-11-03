import { NotFoundError, ForbiddenError } from "../../../shared/errors/errors.js";

export class RoutinesRepository {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  /** @param {string} userId */
  async listByUser(userId) {
    return this.prisma.routine.findMany({
      where: { userId, archivedAt: null },
      orderBy: { createdAt: "desc" },
      include: { routineExercises: { orderBy: { position: "asc" }, include: { exercise: true } } },
    });
  }

  /** @param {string} id @param {string} userId */
  async findById(id, userId) {
    const routine = await this.prisma.routine.findUnique({
      where: { id },
      include: { routineExercises: { orderBy: { position: "asc" }, include: { exercise: true } } },
    });
    if (!routine) throw new NotFoundError("Routine");
    if (routine.userId !== userId) throw new ForbiddenError();
    return routine;
  }

  /** @param {string} userId @param {{ name: string, notes?: string }} data */
  async create(userId, data) {
    return this.prisma.routine.create({ data: { userId, ...data } });
  }

  /** @param {string} id @param {string} userId @param {object} data */
  async update(id, userId, data) {
    await this.findById(id, userId);
    return this.prisma.routine.update({ where: { id }, data });
  }

  /** @param {string} id @param {string} userId */
  async archive(id, userId) {
    await this.findById(id, userId);
    return this.prisma.routine.update({ where: { id }, data: { archivedAt: new Date() } });
  }
}

