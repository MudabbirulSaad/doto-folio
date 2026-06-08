import type { AdminCommentAuthor, AdminCommentRepository } from '@/lib/server/application/comments/admin-comments'

export function createSupabaseAdminCommentRepository(supabaseAdmin: any): AdminCommentRepository {
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
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000
      })

      if (error) throw error

      const userMap = new Map<string, AdminCommentAuthor>()
      users.forEach((user: any) => {
        userMap.set(user.id, {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
          email: user.email,
          avatar: user.user_metadata?.avatar_url
        })
      })

      return userMap
    }
  }
}
