import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type { CommentAuthor, CommentRepository } from '@/lib/server/application/comments/comments'

export function createSupabaseCommentRepository(supabaseAdmin: SupabaseDataClient): CommentRepository {
  return {
    async findCommentsByPost(postId) {
      const { data, error } = await supabaseAdmin
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
      return data || []
    },

    async findUsersByIds() {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers()
      const userMap = new Map<string, CommentAuthor>()

      if (users?.users) {
        users.users.forEach((user: any) => {
          userMap.set(user.id, {
            email: user.email,
            name: user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Anonymous'),
            avatar: user.user_metadata?.avatar_url
          })
        })
      }

      return userMap
    },

    async findPostCommentSettings(postId) {
      const { data: post, error } = await supabaseAdmin
        .from('blog_posts')
        .select('allow_comments')
        .eq('id', postId)
        .single()

      if (error || !post) return null
      return post
    },

    async insertComment(data) {
      const { data: comment, error } = await supabaseAdmin
        .from('blog_comments')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return comment
    }
  }
}
