import type { SupabaseAuthClient, SupabaseAuthUser, SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type { CommentAuthor, CommentRecord, CommentRepository } from '@/lib/server/application/comments/comments'

type SupabaseAdminDataClient = SupabaseDataClient & {
  auth: SupabaseAuthClient & { admin: NonNullable<SupabaseAuthClient['admin']> }
}

export function createSupabaseCommentRepository(supabaseAdmin: SupabaseAdminDataClient): CommentRepository {
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
        .order('created_at', { ascending: true }) as {
          data: CommentRecord[] | null
          error: { message: string } | null
        }

      if (error) throw error
      return data || []
    },

    async findUsersByIds() {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers()
      const userMap = new Map<string, CommentAuthor>()

      if (users?.users) {
        users.users.forEach((user: SupabaseAuthUser) => {
          userMap.set(user.id, {
            email: user.email || '',
            name: typeof user.user_metadata?.full_name === 'string'
              ? user.user_metadata.full_name
              : user.email ? user.email.split('@')[0] : 'Anonymous',
            avatar: typeof user.user_metadata?.avatar_url === 'string'
              ? user.user_metadata.avatar_url
              : undefined
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
        .single<{ allow_comments?: boolean | null }>()

      if (error || !post) return null
      return post
    },

    async insertComment(data) {
      const { data: comment, error } = await supabaseAdmin
        .from('blog_comments')
        .insert(data)
        .select()
        .single<Record<string, unknown>>()

      if (error) throw error
      return comment || {}
    }
  }
}
