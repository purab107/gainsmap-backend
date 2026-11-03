/** @param {{ id: string, userId: string, repo: import('../infrastructure/exercises.repository.js').ExercisesRepository }} */
export async function getExercise({ id, userId, repo }) {
  return repo.findById(id, userId);
}

