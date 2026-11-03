/**
 * User domain entity — pure logic, no DB, no HTTP.
 */

export class User {
  /** @param {object} p */
  constructor({ id, email, name, emailVerified, createdAt, deletedAt }) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.emailVerified = emailVerified;
    this.createdAt = createdAt;
    this.deletedAt = deletedAt;
  }

  get isActive() {
    return this.deletedAt === null;
  }
}

