import { getCurrentAdminUser } from '@/lib/auth/server'
import { ApplicationError } from '@/lib/server/domain/errors'
import { createAgentAccessUseCases } from '@/lib/server/composition/agent-access'
import type { AgentScope, AuthenticatedAgent } from '@/lib/server/application/agent-access/agent-access'
import type { NextRequest } from 'next/server'

export type ApiPrincipal =
  | {
      type: 'admin'
      user: {
        id: string
        email?: string
        role?: string
      }
    }
  | {
      type: 'agent'
      agent: AuthenticatedAgent
    }

export function bearerTokenFromRequest(request: NextRequest | Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.toLowerCase().startsWith('bearer ')) return null

  return authHeader.slice('bearer '.length).trim()
}

export async function authorizeAdminRequest(
  request: NextRequest | Request,
  requiredScope?: AgentScope
): Promise<ApiPrincipal> {
  const user = await getCurrentAdminUser()
  if (user) {
    return {
      type: 'admin',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    }
  }

  const bearerToken = bearerTokenFromRequest(request)
  if (!bearerToken) {
    throw new ApplicationError('UNAUTHORIZED', 'Authentication required')
  }

  const agent = await createAgentAccessUseCases().authenticateToken(
    bearerToken,
    requiredScope,
    'url' in request ? request.url : undefined
  )

  return { type: 'agent', agent }
}
