import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
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

// Schema for Posting Comment
const PostCommentSchema = z.object({
    postId: z.string().uuid(),
    content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long'),
    userId: z.string().uuid(),
    parentId: z.string().uuid().optional()
})

// Create Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    const startTime = Date.now()
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
        return createValidationErrorResponse(['postId is required'])
    }

    try {
        const { data: comments, error } = await supabaseAdmin
            .from('blog_comments')
            .select(`
        id,
        content,
        created_at,
        user_id,
        parent_id
      `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        if (error) throw error

        // Fetch user details manually since we can't join auth.users easily
        const userIds = [...new Set(comments.map(c => c.user_id))]
        const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

        // Map users to a lookup
        const userMap = new Map()
        if (users && users.users) {
            users.users.forEach(u => {
                userMap.set(u.id, {
                    email: u.email,
                    // Generate a pseudo-name from email or metadata
                    name: u.user_metadata?.full_name || (u.email ? u.email.split('@')[0] : 'Anonymous'),
                    avatar: u.user_metadata?.avatar_url
                })
            })
        }

        const enrichedComments = comments.map(comment => ({
            ...comment,
            author: userMap.get(comment.user_id) || { name: 'Anonymous', email: '' }
        }))

        logApiRequest('GET', '/api/comments', 200, Date.now() - startTime)
        return createSuccessResponse(enrichedComments)

    } catch (error) {
        logApiError(error as Error, { method: 'GET', path: '/api/comments' })
        return createInternalErrorResponse('Failed to fetch comments')
    }
}

export async function POST(request: NextRequest) {
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
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user || user.id !== userId) {
            return createUnauthorizedResponse('Invalid or expired session')
        }

        // 4. Check if comments are allowed for this post
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .select('allow_comments')
            .eq('id', postId)
            .single()

        if (postError || !post) {
            return createValidationErrorResponse(['Post not found'])
        }

        if (post.allow_comments === false) {
            return createValidationErrorResponse(['Comments are disabled for this post'])
        }

        // 5. Insert Comment
        const { data: comment, error: insertError } = await supabaseAdmin
            .from('blog_comments')
            .insert({
                post_id: postId,
                user_id: userId,
                content,
                parent_id: parentId || null
            })
            .select()
            .single()

        if (insertError) throw insertError

        logApiRequest('POST', '/api/comments', 200, Date.now() - startTime)
        return createSuccessResponse(comment, 'Comment posted successfully')

    } catch (error) {
        logApiError(error as Error, { method: 'POST', path: '/api/comments' })
        return createInternalErrorResponse('Failed to post comment')
    }
}
