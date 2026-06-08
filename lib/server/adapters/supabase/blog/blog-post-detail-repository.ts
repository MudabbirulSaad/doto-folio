import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type { BlogPost } from '@/lib/types/blog'
import {
  normalizeBlogPost,
  type BlogPostDetailRepository,
  type BlogPostRaw,
  type BlogPostViewContext
} from '@/lib/server/application/blog/blog-post-detail'

const BLOG_POST_SELECT = `
  *,
  category:blog_categories(id, name, slug, description, color),
  tags:blog_post_tags(tag:blog_tags(id, name, slug, description))
`

const RELATED_POST_SELECT = `
  id,
  title,
  slug,
  excerpt,
  featured_image,
  featured_image_alt,
  author_name,
  author_bio,
  reading_time,
  view_count,
  published_at,
  updated_at,
  category:blog_categories(id, name, slug, color)
`

export function createSupabaseBlogPostDetailRepository(supabase: SupabaseDataClient): BlogPostDetailRepository {
  return {
    async findPublishedPostBySlug(slug: string): Promise<BlogPostRaw | null> {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(BLOG_POST_SELECT)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (error) throw new Error(`Failed to fetch blog post: ${error.message}`)
      return data || null
    },

    async findPublishedPostsForRecommendations(currentPostId: string): Promise<BlogPostRaw[]> {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(BLOG_POST_SELECT)
        .eq('status', 'published')
        .neq('id', currentPostId)
        .order('published_at', { ascending: false })

      if (error) throw new Error(`Failed to fetch posts for recommendations: ${error.message}`)
      return data || []
    },

    async findRelatedPosts(post, limit: number): Promise<BlogPost[]> {
      let query = supabase
        .from('blog_posts')
        .select(RELATED_POST_SELECT)
        .eq('status', 'published')
        .neq('id', post.id)
        .limit(limit)

      if (post.category_id) {
        query = query.eq('category_id', post.category_id)
      }

      const { data: categoryPosts, error: categoryError } = await query.order('published_at', { ascending: false })
      if (categoryError) throw new Error(`Failed to fetch related posts: ${categoryError.message}`)

      let relatedPosts = categoryPosts || []

      if (relatedPosts.length < limit) {
        const excludedIds = relatedPosts.map((relatedPost: BlogPost) => relatedPost.id)
        const exclusionFilter = excludedIds.length > 0 ? `(${excludedIds.join(',')})` : null
        let relatedPostsQuery = supabase
          .from('blog_posts')
          .select(RELATED_POST_SELECT)
          .eq('status', 'published')
          .neq('id', post.id)

        if (exclusionFilter) {
          relatedPostsQuery = relatedPostsQuery.not('id', 'in', exclusionFilter)
        }

        const { data: morePosts, error: moreError } = await relatedPostsQuery
          .order('view_count', { ascending: false })
          .limit(limit - relatedPosts.length)

        if (moreError) throw new Error(`Failed to fetch related posts: ${moreError.message}`)

        relatedPosts = [...relatedPosts, ...(morePosts || [])]
      }

      return relatedPosts
        .map((post: BlogPostRaw) => normalizeBlogPost(post))
        .filter(Boolean)
        .slice(0, limit)
    },

    async findPostForViewTracking(slug: string): Promise<{ id: string; view_count: number } | null> {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, view_count')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (error) {
        return null
      }

      return data || null
    },

    async incrementViewCount(postId: string, nextViewCount: number): Promise<void> {
      const { error } = await supabase
        .from('blog_posts')
        .update({ view_count: nextViewCount })
        .eq('id', postId)

      if (error) throw new Error(`Failed to update blog post view count: ${error.message}`)
    },

    async insertBlogView(postId: string, context: BlogPostViewContext): Promise<void> {
      const { error } = await supabase
        .from('blog_views')
        .insert({
          post_id: postId,
          ip_address: context.ipAddress || null,
          user_agent: context.userAgent || null,
          referrer: context.referrer || null
        })

      if (error) {
        console.error('Failed to insert blog view:', error)
      }
    }
  }
}
