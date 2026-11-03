import { NotFoundError } from "../../../shared/errors/errors.js";

export class IdentityRepository {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  /** @param {string} id */
  async findById(id) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** @param {string} email */
  async findByEmail(email) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** @param {string} userId */
  async findSettings(userId) {
    return this.prisma.userSettings.findUnique({ where: { userId } });
  }

  /**
   * Upsert user settings.
   * @param {string} userId
   * @param {object} data
   */
  async upsertSettings(userId, data) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  /** @param {string} id */
  async softDelete(id) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("User");

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

