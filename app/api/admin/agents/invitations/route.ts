import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createInvalidJsonResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/api/response'
import { requireAdminAuth } from '@/lib/auth/server'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { createAgentAccessUseCases } from '@/lib/server/composition/agent-access'

const CreateInvitationSchema = z.object({
  agentLabel: z.string().min(2),
  toolName: z.string().min(2),
  scopes: z.array(z.string()).min(1),
  instructionsMd: z.string().optional(),
  inviteExpiresAt: z.string().datetime().optional(),
  tokenExpiresAt: z.string().datetime().nullable().optional()
})

export async function GET() {
  try {
    await requireAdminAuth()
    const invitations = await createAgentAccessUseCases().listInvitations()
    return createSuccessResponse(invitations)
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminAuth()
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return createInvalidJsonResponse()
    }

    const parsed = CreateInvitationSchema.safeParse(body)
    if (!parsed.success) {
      return createValidationErrorResponse(parsed.error.issues.map(issue => issue.message))
    }

    const result = await createAgentAccessUseCases().createInvitation({
      ...parsed.data,
      adminUserId: admin.id
    })
    return createSuccessResponse(result, 'Agent invitation created')
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error)
  }
}
