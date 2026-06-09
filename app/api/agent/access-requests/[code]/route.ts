import { createSuccessResponse } from '@/lib/api/response'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { createAgentAccessUseCases } from '@/lib/server/composition/agent-access'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const result = await createAgentAccessUseCases().pollRequest(code)
    return createSuccessResponse(result)
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error)
  }
}
