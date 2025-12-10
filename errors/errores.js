export class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export class ValidationAppError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class InternalFlowError extends AppError {
  constructor(message) {
    super(message, 422);
    this.internal = true;
  }
}

export class AuthError extends AppError {
  constructor(message) {
    super(message, 401);
    this.name = "authError";
  }
}
