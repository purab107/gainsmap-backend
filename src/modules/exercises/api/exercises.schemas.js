import { z } from "zod";

export const exerciseListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(["strength", "stretching", "cardio", "olympic", "plyometrics"]).optional(),
  bodyPart: z.enum(["upper_legs", "lower_legs", "back", "chest", "core", "shoulders", "upper_arms", "lower_arms", "full_body"]).optional(),
  equipmentId: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

export const createExerciseSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(["strength", "stretching", "cardio", "olympic", "plyometrics"]),
  bodyPart: z.enum(["upper_legs", "lower_legs", "back", "chest", "core", "shoulders", "upper_arms", "lower_arms", "full_body"]),
  trackingType: z.enum(["weight_reps", "bodyweight_reps", "duration", "distance_time"]),
  equipmentId: z.number().int().optional(),
  mechanic: z.enum(["compound", "isolation"]).optional(),
  forceType: z.enum(["push", "pull", "static", "dynamic"]).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  met: z.number().min(1).max(25).default(5.0),
  isUnilateral: z.boolean().default(false),
  isBodyweight: z.boolean().default(false),
  defaultRestSeconds: z.number().int().min(0).max(1800).optional(),
  tags: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
});

