import { NextRequest } from 'next/server'
import { bearerTokenFromRequest } from '@/lib/auth/api-authorization'
import { createSuccessResponse, createUnauthorizedResponse } from '@/lib/api/response'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { createAgentAccessUseCases } from '@/lib/server/composition/agent-access'

export async function GET(request: NextRequest) {
  try {
    const token = bearerTokenFromRequest(request)
    if (!token) return createUnauthorizedResponse('Missing agent bearer token')

    const agent = await createAgentAccessUseCases().authenticateToken(token)
    return createSuccessResponse(agent)
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error)
  }
}
