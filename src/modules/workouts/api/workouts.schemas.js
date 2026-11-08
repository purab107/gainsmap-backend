import { z } from "zod";

export const startWorkoutSchema = z.object({
  name: z.string().optional(),
  routineId: z.string().uuid().optional(),
  timezone: z.string().default("UTC"),
});

export const logSetSchema = z.object({
  setType: z.enum(["warmup", "working", "drop", "failure"]).default("working"),
  weightKg: z.number().min(0).optional(),
  addedWeightKg: z.number().optional(),
  reps: z.number().int().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  distanceM: z.number().min(0).optional(),
  rir: z.number().min(0).max(10).optional(),
});

export const addWorkoutExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  position: z.number().int().min(0),
  supersetGroup: z.number().int().optional(),
  targetSets: z.number().int().min(1).max(50).optional(),
  repMin: z.number().int().min(0).optional(),
  repMax: z.number().int().min(0).optional(),
  targetRir: z.number().min(0).max(10).optional(),
  restSeconds: z.number().int().min(0).max(1800).optional(),
  loadIncrementKg: z.number().positive().optional(),
});

