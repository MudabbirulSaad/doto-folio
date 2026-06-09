import { createInternalErrorResponse, createSuccessResponse } from '@/lib/api/response'
import { createLogoutUseCase } from '@/lib/server/composition/auth'

export async function POST() {
  try {
    return createSuccessResponse(await (await createLogoutUseCase())())
  } catch (error) {
    return createInternalErrorResponse(
      'Failed to log out',
      error instanceof Error ? [error.message] : undefined
    )
  }
}
