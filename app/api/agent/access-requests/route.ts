import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createInvalidJsonResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/api/response'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { createAgentAccessUseCases } from '@/lib/server/composition/agent-access'

const AccessRequestSchema = z.object({
  agentName: z.string().min(2),
  toolName: z.string().min(2),
  reason: z.string().min(5),
  requestedScopes: z.array(z.string()).min(1)
})

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return createInvalidJsonResponse()
    }

    const parsed = AccessRequestSchema.safeParse(body)
    if (!parsed.success) {
      return createValidationErrorResponse(parsed.error.issues.map(issue => issue.message))
    }

    const result = await createAgentAccessUseCases().createRequest(parsed.data)
    return createSuccessResponse(result, 'Agent access request created')
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error)
  }
}
