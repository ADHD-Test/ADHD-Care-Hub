export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new AppError(400, msg, 'BAD_REQUEST', details);
export const unauthorized = (msg = 'Sign in to continue') =>
  new AppError(401, msg, 'UNAUTHORIZED');
export const forbidden = (msg = 'You do not have access to this resource') =>
  new AppError(403, msg, 'FORBIDDEN');
export const notFound = (msg = 'Resource not found') => new AppError(404, msg, 'NOT_FOUND');
export const conflict = (msg: string) => new AppError(409, msg, 'CONFLICT');
