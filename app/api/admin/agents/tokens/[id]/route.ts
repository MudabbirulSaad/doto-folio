import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createInvalidJsonResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/api/response'
import { requireAdminAuth } from '@/lib/auth/server'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { createAgentAccessUseCases } from '@/lib/server/composition/agent-access'

const UpdateTokenAccessSchema = z.object({
  scopes: z.array(z.string()).min(1),
  expiresAt: z.string().datetime().nullable()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth()
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return createInvalidJsonResponse()
    }

    const parsed = UpdateTokenAccessSchema.safeParse(body)
    if (!parsed.success) {
      return createValidationErrorResponse(parsed.error.issues.map(issue => issue.message))
    }

    const { id } = await params
    const token = await createAgentAccessUseCases().updateTokenAccess({
      id,
      scopes: parsed.data.scopes,
      expiresAt: parsed.data.expiresAt,
      adminUserId: admin.id
    })

    return createSuccessResponse(token, 'Agent token access updated')
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error)
  }
}
