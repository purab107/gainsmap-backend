import { NotFoundError, ForbiddenError, ConflictError } from "../../../shared/errors/errors.js";

export class WorkoutsRepository {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  /** @param {string} userId */
  async listByUser(userId) {
    return this.prisma.workout.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: { workoutExercises: { orderBy: { position: "asc" }, include: { exercise: true } } },
    });
  }

  /** @param {string} id @param {string} userId */
  async findById(id, userId) {
    const workout = await this.prisma.workout.findUnique({
      where: { id },
      include: {
        workoutExercises: {
          orderBy: { position: "asc" },
          include: { exercise: true, sets: { orderBy: { setIndex: "asc" } } },
        },
      },
    });
    if (!workout) throw new NotFoundError("Workout");
    if (workout.userId !== userId) throw new ForbiddenError();
    return workout;
  }

  /** @param {string} userId */
  async findActiveWorkout(userId) {
    return this.prisma.workout.findFirst({ where: { userId, status: "in_progress" } });
  }

  /**
   * Start a new workout. Enforces only one active per user.
   * @param {string} userId @param {{ name?: string, routineId?: string, timezone: string }} data
   */
  async start(userId, { name, routineId, timezone }) {
    const active = await this.findActiveWorkout(userId);
    if (active) throw new ConflictError("A workout is already in progress. Finish it first.");

    const now = new Date();
    const localDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));

    return this.prisma.workout.create({
      data: {
        userId,
        name,
        routineId,
        timezone,
        localDate,
        startedAt: now,
        status: "in_progress",
      },
    });
  }

  /** @param {string} id @param {string} userId */
  async finish(id, userId) {
    const workout = await this.findById(id, userId);
    if (workout.status === "completed") throw new ConflictError("Workout already completed");

    return this.prisma.workout.update({
      where: { id },
      data: { status: "completed", endedAt: new Date() },
    });
  }

  /**
   * Log a set to a workout exercise.
   * @param {string} workoutExerciseId @param {string} userId @param {object} data
   */
  async logSet(workoutExerciseId, userId, data) {
    const we = await this.prisma.workoutExercise.findUnique({ where: { id: workoutExerciseId } });
    if (!we || we.userId !== userId) throw new ForbiddenError();

    const count = await this.prisma.set.count({ where: { workoutExerciseId } });

    return this.prisma.set.create({
      data: {
        userId,
        workoutExerciseId,
        exerciseId: we.exerciseId,
        setIndex: count,
        completedAt: new Date(),
        ...data,
      },
    });
  }

  /**
   * Get previous performance (last completed sets for an exercise).
   * @param {string} userId @param {string} exerciseId @param {number} limit
   */
  async getPreviousPerformance(userId, exerciseId, limit = 5) {
    return this.prisma.set.findMany({
      where: { userId, exerciseId, completedAt: { not: null }, setType: "working" },
      orderBy: { completedAt: "desc" },
      take: limit,
    });
  }
}

