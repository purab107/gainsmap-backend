/**
 * Shared application errors.
 * Modules throw these; the HTTP layer maps them to status codes.
 */

export class AppError extends Error {
  /** @param {string} message @param {string} code @param {number} statusCode */
  constructor(message, code, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, "CONFLICT", 409);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, "FORBIDDEN", 403);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, "VALIDATION_ERROR", 422);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

