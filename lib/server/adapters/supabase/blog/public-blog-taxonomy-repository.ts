import { ApplicationError } from '@/lib/server/domain/errors'
import type { BlogTaxonomyRepository } from '@/lib/server/application/blog/public-blog-taxonomy'

const POST_SELECT = `
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

function offsetFor(page: number, limit: number) {
  return (page - 1) * limit
}

export function createSupabaseBlogTaxonomyRepository(supabase: any): BlogTaxonomyRepository {
  return {
    async getCategoriesWithPostCounts() {
      const { data, error } = await supabase
        .from('blog_categories')
        .select(`
        *,
        posts:blog_posts(count)
      `)
        .eq('blog_posts.status', 'published')
        .order('name')

      if (error) {
        throw new ApplicationError('DATABASE_ERROR', 'Failed to fetch blog categories', [error.message])
      }

      return data || []
    },

    async findCategoryBySlug(slug) {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) return null
      return data
    },

    async findTagBySlug(slug) {
      const { data, error } = await supabase
        .from('blog_tags')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) return null
      return data
    },

    async getPublishedPostsByCategoryId(categoryId, page, limit) {
      const offset = offsetFor(page, limit)
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select(POST_SELECT)
        .eq('category_id', categoryId)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (postsError) {
        throw new ApplicationError('DATABASE_ERROR', 'Failed to fetch category posts', [postsError.message])
      }

      const { count: total, error: countError } = await supabase
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('status', 'published')

      if (countError) {
        throw new ApplicationError('DATABASE_ERROR', 'Failed to count category posts', [countError.message])
      }

      return { posts: posts || [], total: total || 0 }
    },

    async getPostIdsByTagId(tagId) {
      const { data, error } = await supabase
        .from('blog_post_tags')
        .select('post_id')
        .eq('tag_id', tagId)

      if (error) {
        throw new ApplicationError('DATABASE_ERROR', 'Failed to fetch tag relations', [error.message])
      }

      return data?.map((relation: { post_id: string }) => relation.post_id) || []
    },

    async getPublishedPostsByIds(postIds, page, limit) {
      const offset = offsetFor(page, limit)
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select(POST_SELECT)
        .in('id', postIds)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (postsError) {
        throw new ApplicationError('DATABASE_ERROR', 'Failed to fetch posts', [postsError.message])
      }

      const { count: total, error: countError } = await supabase
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .in('id', postIds)
        .eq('status', 'published')

      if (countError) {
        throw new ApplicationError('DATABASE_ERROR', 'Failed to count posts', [countError.message])
      }

      return { posts: posts || [], total: total || 0 }
    }
  }
}
