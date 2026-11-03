export async function getRoutine({ id, userId, repo }) {
  return repo.findById(id, userId);
}

