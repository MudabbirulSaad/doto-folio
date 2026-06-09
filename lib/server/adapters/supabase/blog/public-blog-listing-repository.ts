import type {
  PublicBlogListingRepository,
  PublicBlogPostRecord
} from '@/lib/server/application/blog/public-blog-listing'
import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type { BlogCategory, BlogTag } from '@/lib/types/blog'

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
        .eq('status', 'published') as {
          data: PublicBlogPostRecord[] | null
          error: { message: string } | null
        }

      if (error) {
        throw new Error(`Failed to fetch blog posts: ${error.message}`)
      }

      return data || []
    },
    async getCategories() {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name') as {
          data: BlogCategory[] | null
          error: { message: string } | null
        }

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
        .limit(limit) as {
          data: BlogTag[] | null
          error: { message: string } | null
        }

      if (error) {
        throw new Error(`Failed to fetch blog tags: ${error.message}`)
      }

      return data || []
    }
  }
}
