export async function getWorkout({ id, userId, repo }) {
  return repo.findById(id, userId);
}

