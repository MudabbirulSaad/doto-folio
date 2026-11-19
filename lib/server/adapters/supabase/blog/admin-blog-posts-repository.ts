import type { SupabaseDataClient, SupabaseQuery } from '@/lib/server/adapters/supabase/types'
import { ApplicationError } from '@/lib/server/domain/errors'
import type {
  AdminBlogPostRecord,
  AdminBlogPostRepository,
  NormalizedAdminBlogPostListParams
} from '@/lib/server/application/blog/admin-blog-posts'

const POST_RELATIONS = `
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

const LIST_COLUMNS = 'id,title,slug,excerpt,status,view_count,published_at'

function applyFilters(query: SupabaseQuery, params: NormalizedAdminBlogPostListParams) {
  if (params.status && params.status !== 'all') query = query.eq('status', params.status)
  if (params.category && params.category !== 'all') query = query.eq('category_id', params.category)
  const search = params.search?.trim()
  if (search) {
    // The table searches literal text. Quote the operand separately for PostgREST's OR syntax.
    const pattern = params.listOnly
      ? 'imatch.' + JSON.stringify(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      : 'ilike.' + JSON.stringify(`%${search}%`)
    query = query.or(`title.${pattern},excerpt.${pattern}`)
  }
  return query
}

export function createSupabaseAdminBlogPostRepository(supabase: SupabaseDataClient): AdminBlogPostRepository {
  return {
    async listPosts(params) {
      const offset = (params.page - 1) * params.limit
      const columns = `${params.listOnly ? LIST_COLUMNS : '*'},${POST_RELATIONS}`
      const query = applyFilters(supabase.from('blog_posts').select(columns, { count: 'exact' }), params)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })

      const { data: posts, count, error } = await query.range(offset, offset + params.limit - 1) as {
        data: AdminBlogPostRecord[] | null
        count: number | null
        error: { code?: string; message: string } | null
      }

      if (offset > 0 && error?.code === 'PGRST103') {
        // A deletion can remove the requested page between clicks.
        const remaining = await applyFilters(supabase.from('blog_posts').select('id', { count: 'exact', head: true }), params)
        if (remaining.error) throw new ApplicationError('DATABASE_ERROR', 'Failed to count posts', [remaining.error.message])
        return { posts: [], total: remaining.count ?? 0 }
      }
      if (error) {
        throw new ApplicationError('DATABASE_ERROR', 'Failed to fetch posts', [error.message])
      }

      return {
        posts: posts || [],
        total: count || 0
      }
    },

    async getSummary() {
      const summary = { totalPosts: 0, publishedPosts: 0, draftPosts: 0, totalViews: 0 }
      let after: string | undefined
      // A single select can be capped by the database API. Continue from the last ID even after a short batch.
      while (true) {
        let query = supabase.from('blog_posts').select('id,status,view_count').order('id').limit(1000)
        if (after) query = query.gt('id', after)
        const { data, error } = await query as {
          data: { id: string; status: string; view_count: number | null }[] | null
          error: { message: string } | null
        }
        if (error) throw new ApplicationError('DATABASE_ERROR', 'Failed to fetch post totals', [error.message])
        if (!data?.length) return summary
        for (const post of data) {
          summary.totalPosts++
          if (post.status === 'published') summary.publishedPosts++
          if (post.status === 'draft') summary.draftPosts++
          summary.totalViews += post.view_count ?? 0
        }
        after = data[data.length - 1].id
      }
    },

    async findPostById(id) {
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select(`*,${POST_RELATIONS}`)
        .eq('id', id)
        .single<AdminBlogPostRecord>()

      if (error || !post) return null
      return post
    }
  }
}
