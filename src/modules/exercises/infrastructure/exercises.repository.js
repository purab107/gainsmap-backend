import { NotFoundError, ForbiddenError } from "../../../shared/errors/errors.js";

export class ExercisesRepository {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * List exercises available to a user (catalog + their own custom).
   * @param {{ userId: string, search?: string, category?: string, bodyPart?: string, equipmentId?: number, limit?: number, cursor?: string }} opts
   */
  async list({ userId, search, category, bodyPart, equipmentId, limit = 50, cursor }) {
    const where = {
      deprecatedAt: null,
      AND: [
        { OR: [{ catalogKey: { not: null } }, { ownerUserId: userId }] },
        ...(search
          ? [{ name: { contains: search, mode: "insensitive" } }]
          : []),
        ...(category ? [{ category }] : []),
        ...(bodyPart ? [{ bodyPart }] : []),
        ...(equipmentId !== undefined ? [{ equipmentId }] : []),
      ],
    };

    return this.prisma.exercise.findMany({
      where,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { name: "asc" },
      include: {
        equipment: true,
        muscles: { include: { muscle: true } },
      },
    });
  }

  /** @param {string} id @param {string} userId */
  async findById(id, userId) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: {
        equipment: true,
        muscles: { include: { muscle: true } },
        translations: true,
      },
    });

    if (!exercise) throw new NotFoundError("Exercise");
    if (exercise.ownerUserId && exercise.ownerUserId !== userId) {
      throw new ForbiddenError("Exercise not accessible");
    }
    return exercise;
  }

  /** @param {string} userId @param {object} data */
  async create(userId, data) {
    return this.prisma.exercise.create({
      data: { ownerUserId: userId, ...data },
    });
  }

  /** @param {string} id @param {string} userId @param {object} data */
  async update(id, userId, data) {
    const exercise = await this.findById(id, userId);
    if (!exercise.ownerUserId) throw new ForbiddenError("Cannot modify catalog exercises");

    return this.prisma.exercise.update({ where: { id }, data });
  }

  /** @param {string} id @param {string} userId */
  async delete(id, userId) {
    const exercise = await this.findById(id, userId);
    if (!exercise.ownerUserId) throw new ForbiddenError("Cannot delete catalog exercises");

    return this.prisma.exercise.delete({ where: { id } });
  }
}

