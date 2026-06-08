import type { ApiErrorCode } from '@/lib/api/response'

export class ApplicationError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: string[]
  ) {
    super(message)
    this.name = 'ApplicationError'
  }
}

export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError
}
