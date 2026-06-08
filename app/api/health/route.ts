import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response'
import { withPublicApi } from '@/lib/api/middleware'
import { createHealthCheckUseCase } from '@/lib/server/composition/health'

async function healthCheckHandler() {
  try {
    const checkHealth = createHealthCheckUseCase()
    return createSuccessResponse(await checkHealth())
    
  } catch (error) {
    return createInternalErrorResponse(
      'Health check failed',
      [(error as Error).message]
    )
  }
}

export const GET = withPublicApi(async () => {
  return await healthCheckHandler()
})
