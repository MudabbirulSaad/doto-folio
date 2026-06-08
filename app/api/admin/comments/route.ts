import { NextRequest } from 'next/server'
import {
  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse
} from '@/lib/api/response'
import { requireAdminAuth } from '@/lib/auth/server'
import { createAdminCommentUseCases } from '@/lib/server/composition/comments'

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth()
    const comments = await createAdminCommentUseCases().list()
    return createSuccessResponse(comments)
  } catch (error: any) {
    console.error('Admin Comments API Error:', error)
    if (error.message?.includes('Unauthorized') || error.message?.includes('Admin access required')) {
      return createUnauthorizedResponse(error.message)
    }
    return createErrorResponse(error.message || 'Failed to fetch comments', 500)
  }
}
