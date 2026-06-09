import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdminRequest, type ApiPrincipal } from '@/lib/auth/api-authorization'
import { rateLimit, type RateLimitResult } from './rate-limit'
import { 
  createUnauthorizedResponse,
  createForbiddenResponse,
  createRateLimitResponse,
  createInternalErrorResponse,
  logApiRequest,
  logApiError
} from './response'
import { ApplicationError } from '@/lib/server/domain/errors'
import type { AgentScope } from '@/lib/server/application/agent-access/agent-access'

// =============================================
// MIDDLEWARE TYPES
// =============================================

export interface ApiContext {
  request: NextRequest
  user?: {
    id: string
    email?: string
    role?: string
  }
  principal?: ApiPrincipal
  rateLimitResult?: RateLimitResult
  startTime: number
  origin?: string
}

export interface ApiRouteContext<TParams = Record<string, string>> {
  params: TParams
}

export interface NextApiRouteContext<TParams = Record<string, string>> {
  params: Promise<TParams>
}

export type ApiHandler<
  TParams = Record<string, string>,
  TRouteContext extends ApiRouteContext<TParams> = ApiRouteContext<TParams>
> = (
  context: ApiContext,
  routeContext: TRouteContext
) => Promise<NextResponse>

export interface MiddlewareOptions {
  requireAuth?: boolean
  requiredScope?: AgentScope
  rateLimit?: 'contact' | 'admin' | 'public' | false
  skipLogging?: boolean
}

// =============================================
// MIDDLEWARE WRAPPER
// =============================================

export function withMiddleware<
  TParams = Record<string, string>,
  TRouteContext extends ApiRouteContext<TParams> = ApiRouteContext<TParams>
>(
  handler: ApiHandler<TParams, TRouteContext>,
  options: MiddlewareOptions = {}
) {
  return async (request: NextRequest, routeContext: NextApiRouteContext<TParams>): Promise<NextResponse> => {
    const startTime = Date.now()
    const origin = request.headers.get('origin') || undefined
    const method = request.method
    const path = request.nextUrl.pathname

    try {
      // Initialize context
      const context: ApiContext = {
        request,
        startTime,
        origin
      }

      // Rate limiting
      if (options.rateLimit !== false) {
        const rateLimitKey = options.rateLimit || 'public'
        const rateLimitResult = rateLimit(request, rateLimitKey)
        
        if (!rateLimitResult.success) {
          if (!options.skipLogging) {
            logApiRequest(method, path, 429, Date.now() - startTime)
          }
          return createRateLimitResponse(rateLimitResult, { origin })
        }
        
        context.rateLimitResult = rateLimitResult
      }

      // Authentication
      if (options.requireAuth) {
        try {
          const principal = await authorizeAdminRequest(request, options.requiredScope)
          context.principal = principal
          if (principal.type === 'admin') context.user = principal.user
        } catch (authError) {
          logApiError(authError as Error, { method, path })
          const status = authError instanceof ApplicationError && authError.code === 'FORBIDDEN' ? 403 : 401
          if (!options.skipLogging) {
            logApiRequest(method, path, status, Date.now() - startTime)
          }
          if (status === 403 && authError instanceof Error) {
            return createForbiddenResponse(authError.message, {
              origin,
              rateLimitResult: context.rateLimitResult
            })
          }
          return createUnauthorizedResponse(authError instanceof Error ? authError.message : 'Authentication failed', { 
            origin, 
            rateLimitResult: context.rateLimitResult 
          })
        }
      }

      // Execute handler
      const resolvedRouteContext = routeContext
        ? { ...routeContext, params: await routeContext.params } as TRouteContext
        : routeContext as unknown as TRouteContext
      const response = await handler(context, resolvedRouteContext)

      // Log successful request
      if (!options.skipLogging) {
        logApiRequest(method, path, response.status, Date.now() - startTime)
      }

      return response

    } catch (error) {
      // Log error
      logApiError(error as Error, { method, path })
      
      if (!options.skipLogging) {
        logApiRequest(method, path, 500, Date.now() - startTime)
      }

      return createInternalErrorResponse(
        'An unexpected error occurred',
        undefined,
        { origin }
      )
    }
  }
}

// =============================================
// SPECIALIZED MIDDLEWARE
// =============================================

export function withAuth<
  TParams = Record<string, string>,
  TRouteContext extends ApiRouteContext<TParams> = ApiRouteContext<TParams>
>(handler: ApiHandler<TParams, TRouteContext>) {
  return withMiddleware(handler, { 
    requireAuth: true, 
    rateLimit: 'admin' 
  })
}

export function withScopedAuth<
  TParams = Record<string, string>,
  TRouteContext extends ApiRouteContext<TParams> = ApiRouteContext<TParams>
>(handler: ApiHandler<TParams, TRouteContext>, requiredScope: AgentScope) {
  return withMiddleware(handler, { 
    requireAuth: true, 
    requiredScope,
    rateLimit: 'admin' 
  })
}

export function withRateLimit<
  TParams = Record<string, string>,
  TRouteContext extends ApiRouteContext<TParams> = ApiRouteContext<TParams>
>(
  handler: ApiHandler<TParams, TRouteContext>,
  rateLimitKey: 'contact' | 'admin' | 'public'
) {
  return withMiddleware(handler, { rateLimit: rateLimitKey })
}

export function withPublicApi<
  TParams = Record<string, string>,
  TRouteContext extends ApiRouteContext<TParams> = ApiRouteContext<TParams>
>(handler: ApiHandler<TParams, TRouteContext>) {
  return withMiddleware(handler, { rateLimit: 'public' })
}

export function withContactApi<
  TParams = Record<string, string>,
  TRouteContext extends ApiRouteContext<TParams> = ApiRouteContext<TParams>
>(handler: ApiHandler<TParams, TRouteContext>) {
  return withMiddleware(handler, { rateLimit: 'contact' })
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

export function extractParams(request: NextRequest, paramNames: string[]): Record<string, string> {
  const url = new URL(request.url)
  const params: Record<string, string> = {}
  
  paramNames.forEach(name => {
    const value = url.searchParams.get(name)
    if (value) {
      params[name] = value
    }
  })
  
  return params
}

export function getPaginationParams(request: NextRequest) {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(
    parseInt(url.searchParams.get('limit') || '20', 10),
    100 // Maximum limit
  )
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

export function getFilterParams(request: NextRequest, allowedFilters: string[]) {
  const url = new URL(request.url)
  const filters: Record<string, string | number | boolean> = {}
  
  allowedFilters.forEach(filter => {
    const value = url.searchParams.get(filter)
    if (value !== null) {
      // Handle boolean filters
      if (value === 'true' || value === 'false') {
        filters[filter] = value === 'true'
      } else {
        filters[filter] = value
      }
    }
  })
  
  return filters
}

// =============================================
// ERROR HANDLING HELPERS
// =============================================

export function handleDatabaseError(error: Error, operation: string): never {
  const message = `Database ${operation} failed: ${error.message}`
  logApiError(new Error(message), { method: 'UNKNOWN', path: 'UNKNOWN' })
  throw new Error(message)
}

export function handleValidationError(errors: string[]): never {
  const message = `Validation failed: ${errors.join(', ')}`
  throw new Error(message)
}

// =============================================
// RESPONSE HELPERS
// =============================================

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  const hasMore = (page * limit) < total
  
  return {
    data,
    meta: {
      total,
      page,
      limit,
      hasMore,
      totalPages: Math.ceil(total / limit)
    }
  }
}
