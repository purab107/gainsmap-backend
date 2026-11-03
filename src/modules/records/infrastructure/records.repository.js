export class RecordsRepository {
  constructor(prisma) { this.prisma = prisma; }

  async listForUser(userId) {
    return this.prisma.personalRecord.findMany({
      where: { userId },
      orderBy: [{ exerciseId: "asc" }, { recordType: "asc" }],
      include: { exercise: { select: { id: true, name: true } } },
    });
  }

  async findForExercise(userId, exerciseId) {
    return this.prisma.personalRecord.findMany({ where: { userId, exerciseId } });
  }
}

