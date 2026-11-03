/** @param {{ userId: string, filters: object, repo: import('../infrastructure/exercises.repository.js').ExercisesRepository }} */
export async function searchExercises({ userId, filters, repo }) {
  return repo.list({ userId, ...filters });
}

