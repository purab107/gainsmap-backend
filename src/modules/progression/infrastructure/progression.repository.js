export class ProgressionRepository {
  constructor(prisma) { this.prisma = prisma; }

  async listForUser(userId) {
    return this.prisma.progressionRecommendation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { exercise: { select: { id: true, name: true } } },
    });
  }

  async resolve(id, userId, status, appliedWeightKg) {
    return this.prisma.progressionRecommendation.updateMany({
      where: { id, userId },
      data: { status, appliedWeightKg, resolvedAt: new Date() },
    });
  }
}

