import type { SupabaseAuthClient, SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type { AdminCommentAuthor, AdminCommentRepository } from '@/lib/server/application/comments/admin-comments'

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
        .order('created_at', { ascending: false })

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
      users.forEach((user: any) => {
        userMap.set(user.id, {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
          email: user.email,
          avatar: user.user_metadata?.avatar_url
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
