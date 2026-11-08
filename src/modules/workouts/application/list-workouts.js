export async function listWorkouts({ userId, repo }) {
  return repo.listByUser(userId);
}

