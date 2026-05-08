export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly fields?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'AppError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}
