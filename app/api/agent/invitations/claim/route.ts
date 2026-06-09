import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createInvalidJsonResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/api/response'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { createAgentAccessUseCases } from '@/lib/server/composition/agent-access'

const ClaimInvitationSchema = z.object({
  code: z.string().min(4)
})

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return createInvalidJsonResponse()
    }

    const parsed = ClaimInvitationSchema.safeParse(body)
    if (!parsed.success) {
      return createValidationErrorResponse(parsed.error.issues.map(issue => issue.message))
    }

    const result = await createAgentAccessUseCases().claimInvitation(parsed.data.code)
    return createSuccessResponse(result, 'Agent invitation claimed')
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error)
  }
}
