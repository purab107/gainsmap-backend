export async function listPersonalRecords({ userId, repo }) {
  return repo.listForUser(userId);
}

