import { NextRequest } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createAdminCommentUseCases } from '@/lib/server/composition/comments'
import { isApplicationError } from '@/lib/server/domain/errors'
import { createApplicationErrorResponse } from '@/lib/server/adapters/http/errors'

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request, 'comments:read')
    const comments = await createAdminCommentUseCases().list()
    return createSuccessResponse(comments)
  } catch (error: any) {
    console.error('Admin Comments API Error:', error)
    if (isApplicationError(error)) return createApplicationErrorResponse(error)
    return createErrorResponse(error.message || 'Failed to fetch comments', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authorizeAdminRequest(request, 'comments:delete')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || ''
    const result = await createAdminCommentUseCases().delete(id)
    return createSuccessResponse(result)
  } catch (error: any) {
    console.error('Admin Comment Delete API Error:', error)
    if (isApplicationError(error)) return createApplicationErrorResponse(error)
    return createErrorResponse(error.message || 'Failed to delete comment', 500)
  }
}
