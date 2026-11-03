export async function listRoutines({ userId, repo }) {
  return repo.listByUser(userId);
}

