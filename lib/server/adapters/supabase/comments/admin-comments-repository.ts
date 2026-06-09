import type { SupabaseAuthClient, SupabaseAuthUser, SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type {
  AdminCommentAuthor,
  AdminCommentRecord,
  AdminCommentRepository
} from '@/lib/server/application/comments/admin-comments'

type SupabaseAdminDataClient = SupabaseDataClient & {
  auth: SupabaseAuthClient & { admin: NonNullable<SupabaseAuthClient['admin']> }
}

export function createSupabaseAdminCommentRepository(supabaseAdmin: SupabaseAdminDataClient): AdminCommentRepository {
  return {
    async listCommentsWithPosts() {
      const { data: comments, error } = await supabaseAdmin
        .from('blog_comments')
        .select(`
        *,
        post:blog_posts(title, slug)
      `)
        .order('created_at', { ascending: false }) as {
          data: AdminCommentRecord[] | null
          error: { message: string } | null
        }

      if (error) throw error
      return comments || []
    },

    async listUsers() {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000
      })

      if (error) throw error

      const userMap = new Map<string, AdminCommentAuthor>()
      const users = data?.users || []
      users.forEach((user: SupabaseAuthUser) => {
        userMap.set(user.id, {
          name: typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : user.email?.split('@')[0] || 'Anonymous',
          email: user.email,
          avatar: typeof user.user_metadata?.avatar_url === 'string'
            ? user.user_metadata.avatar_url
            : undefined
        })
      })

      return userMap
    },

    async deleteComment(id: string) {
      const { error } = await supabaseAdmin
        .from('blog_comments')
        .delete()
        .eq('id', id)

      if (error) throw error
    }
  }
}
