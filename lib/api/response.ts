import { NextResponse } from 'next/server'
import { getSecurityHeaders, getCorsHeaders, createRateLimitHeaders, type RateLimitResult } from './rate-limit'

// =============================================
// STANDARD API RESPONSE TYPES
// =============================================

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: string[]
    field?: string
  }
  requestId?: string
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse
export type ApiErrorCode = keyof typeof ERROR_CODES

// =============================================
// ERROR CODES
// =============================================

export const ERROR_CODES = {
  // Client Errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  REQUEST_TOO_LARGE: 'REQUEST_TOO_LARGE',
  INVALID_JSON: 'INVALID_JSON',
  
  // Server Errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EMAIL_ERROR: 'EMAIL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const

// =============================================
// RESPONSE BUILDERS
// =============================================

interface ResponseOptions {
  headers?: Record<string, string>
  rateLimitResult?: RateLimitResult
  origin?: string
  compress?: boolean
}

type SuccessMessageOrStatus = string | number

function statusToErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR'
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 429:
      return 'RATE_LIMITED'
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR'
  }
}

function normalizeErrors(errors: string | string[]): string[] {
  return Array.isArray(errors) ? errors : [errors]
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: ApiSuccessResponse<T>['meta'],
  options?: ResponseOptions
): NextResponse
export function createSuccessResponse<T>(
  data: T,
  status: number,
  meta?: ApiSuccessResponse<T>['meta'],
  options?: ResponseOptions
): NextResponse
export function createSuccessResponse<T>(
  data: T,
  messageOrStatus?: SuccessMessageOrStatus,
  meta?: ApiSuccessResponse<T>['meta'],
  options: ResponseOptions = {}
): NextResponse {
  const status = typeof messageOrStatus === 'number' ? messageOrStatus : 200
  const message = typeof messageOrStatus === 'string' ? messageOrStatus : undefined
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    message,
    meta
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getSecurityHeaders(),
    ...getCorsHeaders(options.origin),
    ...(options.rateLimitResult ? createRateLimitHeaders(options.rateLimitResult) : {}),
    ...options.headers
  }

  // Add compression hint for large responses
  if (options.compress) {
    headers['Content-Encoding'] = 'gzip'
  }

  return NextResponse.json(response, {
    status,
    headers
  })
}

export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: string[],
  field?: string,
  options?: ResponseOptions
): NextResponse
export function createErrorResponse(
  message: string,
  status: number,
  details?: string[],
  field?: string,
  options?: ResponseOptions
): NextResponse
export function createErrorResponse(
  codeOrMessage: ApiErrorCode | string,
  messageOrStatus: string | number,
  statusOrDetails?: number | string[],
  details?: string[] | string,
  fieldOrOptions?: string | ResponseOptions,
  maybeOptions: ResponseOptions = {}
): NextResponse {
  const isLegacySignature = typeof messageOrStatus === 'number'
  const status = isLegacySignature ? messageOrStatus : statusOrDetails as number
  const code = isLegacySignature
    ? statusToErrorCode(status)
    : codeOrMessage as ApiErrorCode
  const message = isLegacySignature ? codeOrMessage : messageOrStatus
  const responseDetails = isLegacySignature
    ? Array.isArray(statusOrDetails) ? statusOrDetails : undefined
    : details as string[] | undefined
  const field = isLegacySignature
    ? typeof details === 'string' ? details : undefined
    : typeof fieldOrOptions === 'string' ? fieldOrOptions : undefined
  const options = (typeof fieldOrOptions === 'object' ? fieldOrOptions : maybeOptions) || {}

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details: responseDetails,
      field
    },
    requestId: generateRequestId()
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getSecurityHeaders(),
    ...getCorsHeaders(options.origin),
    ...(options.rateLimitResult ? createRateLimitHeaders(options.rateLimitResult) : {}),
    ...options.headers
  }

  return NextResponse.json(response, {
    status,
    headers
  })
}

// =============================================
// SPECIFIC ERROR RESPONSES
// =============================================

export function createValidationErrorResponse(
  errors: string | string[],
  field?: string,
  options: ResponseOptions = {}
): NextResponse {
  return createErrorResponse(
    'VALIDATION_ERROR',
    'Validation failed',
    400,
    normalizeErrors(errors),
    field,
    options
  )
}

export function createInvalidJsonResponse(
  message = 'Invalid JSON format',
  options: ResponseOptions = {}
): NextResponse {
  return createErrorResponse(
    'INVALID_JSON',
    message,
    400,
    undefined,
    undefined,
    options
  )
}

export function createUnauthorizedResponse(
  message = 'Authentication required',
  options: ResponseOptions = {}
): NextResponse {
  return createErrorResponse(
    'UNAUTHORIZED',
    message,
    401,
    undefined,
    undefined,
    options
  )
}

export function createForbiddenResponse(
  message = 'Access denied',
  options: ResponseOptions = {}
): NextResponse {
  return createErrorResponse(
    'FORBIDDEN',
    message,
    403,
    undefined,
    undefined,
    options
  )
}

export function createNotFoundResponse(
  message = 'Resource not found',
  options: ResponseOptions = {}
): NextResponse {
  return createErrorResponse(
    'NOT_FOUND',
    message,
    404,
    undefined,
    undefined,
    options
  )
}

export function createRateLimitResponse(
  rateLimitResult: RateLimitResult,
  options: ResponseOptions = {}
): NextResponse {
  return createErrorResponse(
    'RATE_LIMITED',
    'Too many requests',
    429,
    [`Try again in ${rateLimitResult.retryAfter} seconds`],
    undefined,
    { ...options, rateLimitResult }
  )
}

export function createInternalErrorResponse(
  message = 'Internal server error',
  details?: string[],
  options: ResponseOptions = {}
): NextResponse {
  return createErrorResponse(
    'INTERNAL_ERROR',
    message,
    500,
    details,
    undefined,
    options
  )
}

export function createNotFoundErrorResponse(
  message = 'Resource not found',
  details?: string[],
  options: ResponseOptions = {}
): NextResponse {
  return createErrorResponse(
    'NOT_FOUND',
    message,
    404,
    details,
    undefined,
    options
  )
}

export function createDatabaseErrorResponse(
  message = 'Database operation failed',
  options: ResponseOptions = {}
): NextResponse {
  return createErrorResponse(
    'DATABASE_ERROR',
    message,
    500,
    undefined,
    undefined,
    options
  )
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function createOptionsResponse(options: ResponseOptions = {}): NextResponse {
  const headers: Record<string, string> = {
    ...getSecurityHeaders(),
    ...getCorsHeaders(options.origin),
    ...options.headers
  }

  return new NextResponse(null, {
    status: 200,
    headers
  })
}

// =============================================
// RESPONSE COMPRESSION
// =============================================

export function shouldCompress(data: unknown): boolean {
  const jsonString = JSON.stringify(data)
  return jsonString.length > 1024 // Compress responses larger than 1KB
}

// =============================================
// LOGGING HELPERS
// =============================================

export function logApiRequest(
  method: string,
  path: string,
  status: number,
  duration: number,
  requestId?: string
): void {
  const timestamp = new Date().toISOString()
  const logLevel = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO'
  
  console.log(
    `[${timestamp}] ${logLevel} ${method} ${path} ${status} ${duration}ms ${requestId || ''}`
  )
}

export function logApiError(
  error: Error,
  context: {
    method: string
    path: string
    requestId?: string
    userId?: string
  }
): void {
  const timestamp = new Date().toISOString()
  
  console.error(
    `[${timestamp}] ERROR ${context.method} ${context.path}`,
    {
      message: error.message,
      stack: error.stack,
      requestId: context.requestId,
      userId: context.userId
    }
  )
}
