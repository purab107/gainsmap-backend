import { z } from "zod";

export const updateSettingsSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]).optional(),
  language: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/).optional(),
  timezone: z.string().optional(),
  weekStartsOn: z.enum(["monday", "sunday"]).optional(),
  restTimerEnabled: z.boolean().optional(),
  defaultLoadIncrementKg: z.number().positive().optional(),
});

