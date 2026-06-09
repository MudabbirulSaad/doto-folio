import type { PublicBlogListingRepository } from '@/lib/server/application/blog/public-blog-listing'
import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'

export function createSupabasePublicBlogListingRepository(
  supabase: SupabaseDataClient
): PublicBlogListingRepository {
  return {
    async getPublishedPosts() {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
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
        `)
        .eq('status', 'published')

      if (error) {
        throw new Error(`Failed to fetch blog posts: ${error.message}`)
      }

      return data || []
    },
    async getCategories() {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch blog categories: ${error.message}`)
      }

      return data || []
    },
    async getPopularTags(limit: number) {
      const { data, error } = await supabase
        .from('blog_tags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Failed to fetch blog tags: ${error.message}`)
      }

      return data || []
    }
  }
}
