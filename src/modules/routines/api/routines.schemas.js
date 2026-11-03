import { z } from "zod";

export const createRoutineSchema = z.object({
  name: z.string().min(1).max(200),
  notes: z.string().optional(),
});

export const addRoutineExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  position: z.number().int().min(0),
  supersetGroup: z.number().int().optional(),
  targetSets: z.number().int().min(1).max(50).default(3),
  repMin: z.number().int().min(0).optional(),
  repMax: z.number().int().min(0).optional(),
  targetRir: z.number().min(0).max(10).optional(),
  restSeconds: z.number().int().min(0).max(1800).optional(),
  loadIncrementKg: z.number().positive().optional(),
  notes: z.string().optional(),
});

