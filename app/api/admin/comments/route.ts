import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api/response'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createAdminCommentUseCases } from '@/lib/server/composition/comments'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request, 'comments:read')
    const comments = await createAdminCommentUseCases().list()
    return createSuccessResponse(comments)
  } catch (error) {
    console.error('Admin Comments API Error:', error)
    return createApplicationOrInternalErrorResponse(error, 'Failed to fetch comments')
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authorizeAdminRequest(request, 'comments:delete')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || ''
    const result = await createAdminCommentUseCases().delete(id)
    return createSuccessResponse(result)
  } catch (error) {
    console.error('Admin Comment Delete API Error:', error)
    return createApplicationOrInternalErrorResponse(error, 'Failed to delete comment')
  }
}
