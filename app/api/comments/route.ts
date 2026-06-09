import { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseAndValidateJSON } from '@/lib/api/validation'
import { rateLimit } from '@/lib/api/rate-limit'
import {
    createSuccessResponse,
    createValidationErrorResponse,
    createRateLimitResponse,
    createInternalErrorResponse,
    createUnauthorizedResponse,
    logApiRequest,
    logApiError
} from '@/lib/api/response'
import { createCommentUseCases } from '@/lib/server/composition/comments'
import { isApplicationError } from '@/lib/server/domain/errors'
import { createApplicationErrorResponse } from '@/lib/server/adapters/http/errors'

// Schema for Posting Comment
const PostCommentSchema = z.object({
    postId: z.string().uuid(),
    content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long'),
    userId: z.string().uuid().optional(),
    parentId: z.string().uuid().optional()
})

type CommentUseCases = Pick<ReturnType<typeof createCommentUseCases>, 'create'>

export async function GET(request: NextRequest) {
    const startTime = Date.now()
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
        return createValidationErrorResponse(['postId is required'])
    }

    try {
        const comments = await createCommentUseCases().list(postId)

        logApiRequest('GET', '/api/comments', 200, Date.now() - startTime)
        return createSuccessResponse(comments)

    } catch (error) {
        logApiError(error as Error, { method: 'GET', path: '/api/comments' })
        return createInternalErrorResponse('Failed to fetch comments')
    }
}

export async function handlePostComment(request: NextRequest, commentUseCases: CommentUseCases) {
    const startTime = Date.now()
    const origin = request.headers.get('origin') || undefined

    try {
        // 1. Rate Limiting
        const rateLimitResult = rateLimit(request, 'comments')
        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult, { origin })
        }

        // 2. Validate Payload
        const validation = await parseAndValidateJSON(request, PostCommentSchema)
        if (!validation.success) {
            return createValidationErrorResponse(validation.errors!, undefined, { origin })
        }

        const { postId, content, userId, parentId } = validation.data!

        // 3. Verify User
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
            return createUnauthorizedResponse('Missing Authorization header')
        }

        const token = authHeader.replace('Bearer ', '')
        const commentInput = {
            postId,
            content,
            ...(userId ? { userId } : {}),
            ...(parentId ? { parentId } : {})
        }
        const comment = await commentUseCases.create(token, commentInput)

        logApiRequest('POST', '/api/comments', 200, Date.now() - startTime)
        return createSuccessResponse(comment, 'Comment posted successfully')

    } catch (error) {
        if (isApplicationError(error)) {
            if (error.code === 'UNAUTHORIZED') {
                return createUnauthorizedResponse(error.message)
            }
            return createApplicationErrorResponse(error)
        }

        logApiError(error as Error, { method: 'POST', path: '/api/comments' })
        return createInternalErrorResponse('Failed to post comment')
    }
}

export async function POST(request: NextRequest) {
    return handlePostComment(request, createCommentUseCases())
}
