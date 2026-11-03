import { NotFoundError } from "../../../shared/errors/errors.js";

/** @param {{ userId: string, repo: import('../infrastructure/identity.repository.js').IdentityRepository }} */
export async function getCurrentUser({ userId, repo }) {
  const user = await repo.findById(userId);
  if (!user || user.deletedAt) throw new NotFoundError("User");

  const settings = await repo.findSettings(userId);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    settings: settings
      ? {
          unitSystem: settings.unitSystem,
          language: settings.language,
          timezone: settings.timezone,
          weekStartsOn: settings.weekStartsOn,
          restTimerEnabled: settings.restTimerEnabled,
          defaultLoadIncrementKg: Number(settings.defaultLoadIncrementKg),
        }
      : null,
  };
}

