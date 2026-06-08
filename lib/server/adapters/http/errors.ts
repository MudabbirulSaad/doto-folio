import { createErrorResponse } from '@/lib/api/response'
import type { ApiErrorCode } from '@/lib/api/response'
import { createInternalErrorResponse } from '@/lib/api/response'
import { ApplicationError } from '@/lib/server/domain/errors'

const STATUS_BY_CODE: Partial<Record<ApiErrorCode, number>> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429
}

export function statusForApplicationError(code: ApiErrorCode) {
  return STATUS_BY_CODE[code] || 500
}

export function createApplicationErrorResponse(error: ApplicationError) {
  return createErrorResponse(
    error.code,
    error.message,
    statusForApplicationError(error.code),
    error.details
  )
}

export function createApplicationOrInternalErrorResponse(error: unknown, internalMessage = 'Internal server error') {
  if (error instanceof ApplicationError) {
    return createApplicationErrorResponse(error)
  }

  return createInternalErrorResponse(
    internalMessage,
    error instanceof Error ? [error.message] : undefined
  )
}
