import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
    createSuccessResponse,
    createErrorResponse,
    createUnauthorizedResponse
} from '@/lib/api/response'
import { requireAdminAuth } from '@/lib/auth/server'

// Create Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    try {
        // 1. Verify Admin Auth
        await requireAdminAuth()

        // 2. Fetch all comments
        const { data: comments, error } = await supabaseAdmin
            .from('blog_comments')
            .select(`
        *,
        post:blog_posts(title, slug)
      `)
            .order('created_at', { ascending: false })

        if (error) throw error

        // 3. Fetch user details
        // Get unique user IDs
        const userIds = [...new Set(comments.map(c => c.user_id))]

        // Fetch users from Auth API
        // Note: listUsers() might have pagination, but for now we assume < 50 users or we can loop.
        // For production with many users, we should use a more robust method or cache.
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 1000 // Fetch reasonably large number
        })

        if (usersError) throw usersError

        // 4. Map users to lookup
        const userMap = new Map()
        users.forEach(u => {
            userMap.set(u.id, {
                name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Anonymous',
                email: u.email,
                avatar: u.user_metadata?.avatar_url
            })
        })

        // 5. Enrich comments
        const enrichedComments = comments.map(comment => ({
            ...comment,
            author_name: userMap.get(comment.user_id)?.name || 'Anonymous',
            author_email: userMap.get(comment.user_id)?.email || 'No Email',
            author_avatar: userMap.get(comment.user_id)?.avatar
        }))

        return createSuccessResponse(enrichedComments)

    } catch (error: any) {
        console.error('Admin Comments API Error:', error)
        if (error.message?.includes('Unauthorized') || error.message?.includes('Admin access required')) {
            return createUnauthorizedResponse(error.message)
        }
        return createErrorResponse(error.message || 'Failed to fetch comments', 500)
    }
}
