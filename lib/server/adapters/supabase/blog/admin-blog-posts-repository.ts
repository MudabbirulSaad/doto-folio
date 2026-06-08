import { ApplicationError } from '@/lib/server/domain/errors'
import type { AdminBlogPostRepository } from '@/lib/server/application/blog/admin-blog-posts'

const ADMIN_POST_SELECT = `
  *,
  category:blog_categories(
    id,
    name,
    slug,
    color
  ),
  tags:blog_post_tags(
    tag:blog_tags(
      id,
      name,
      slug
    )
  )
`

export function createSupabaseAdminBlogPostRepository(supabase: any): AdminBlogPostRepository {
  return {
    async listPosts(params) {
      const offset = (params.page - 1) * params.limit
      let query = supabase
        .from('blog_posts')
        .select(ADMIN_POST_SELECT)
        .order('created_at', { ascending: false })

      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status)
      }

      if (params.category && params.category !== 'all') {
        query = query.eq('category_id', params.category)
      }

      if (params.search) {
        query = query.or(`title.ilike.%${params.search}%,excerpt.ilike.%${params.search}%`)
      }

      const { count } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })

      const { data: posts, error } = await query.range(offset, offset + params.limit - 1)

      if (error) {
        throw new ApplicationError('DATABASE_ERROR', 'Failed to fetch posts', [error.message])
      }

      return {
        posts: posts || [],
        total: count || 0
      }
    },

    async findPostById(id) {
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select(ADMIN_POST_SELECT)
        .eq('id', id)
        .single()

      if (error || !post) return null
      return post
    }
  }
}
