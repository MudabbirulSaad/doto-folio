import type { BlogCategory, BlogTag, BlogPost, BlogPostWithRelations } from '@/lib/types/blog'
import { getHybridRecommendations } from '@/lib/services/recommendation'

export type RawTagRelation = BlogTag | { tag: BlogTag }

export interface BlogPostViewContext {
  ipAddress?: string | null
  userAgent?: string | null
  referrer?: string | null
}

export interface BlogPostDetailResult {
  post: BlogPostWithRelations | null
  relatedPosts: BlogPost[]
}

export interface BlogPostDetailRepository {
  findPublishedPostBySlug(slug: string): Promise<BlogPostRaw | null>
  findPublishedPostsForRecommendations(currentPostId: string): Promise<BlogPostRaw[]>
  findRelatedPosts(post: BlogPostWithRelations, limit: number): Promise<BlogPost[]>
  findPostForViewTracking(slug: string): Promise<{ id: string; view_count: number } | null>
  incrementViewCount(postId: string, nextViewCount: number): Promise<void>
  insertBlogView(postId: string, context: BlogPostViewContext): Promise<void>
}

export interface BlogPostRaw {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image?: string
  featured_image_alt?: string
  meta_title?: string
  meta_description?: string
  author_name: string
  author_bio: string
  author_avatar?: string | null
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  view_count: number
  reading_time: number
  category_id?: string | null
  published_at?: string | null
  created_at: string
  updated_at: string
  category?: BlogCategory | null
  tags?: RawTagRelation[] | null
}

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

function normalizeTag(tagOrRelation: RawTagRelation): BlogTag | null {
  if (!tagOrRelation) return null
  if ('tag' in tagOrRelation) return tagOrRelation.tag as BlogTag
  return tagOrRelation as BlogTag
}

function normalizeBlogPost(rawPost: BlogPostRaw): BlogPostWithRelations {
  return {
    ...rawPost,
    category_id: rawPost.category_id || undefined,
    published_at: rawPost.published_at || undefined,
    author_avatar: rawPost.author_avatar || undefined,
    category: rawPost.category || null,
    tags: (rawPost.tags || []).map(normalizeTag).filter((tag): tag is BlogTag => Boolean(tag))
  }
}

export class BlogPostDetailService {
  constructor(private readonly repository: BlogPostDetailRepository) {}

  async readMetadata(slug: string): Promise<BlogPostWithRelations | null> {
    const post = await this.repository.findPublishedPostBySlug(slug)
    if (!post) return null

    return normalizeBlogPost(post)
  }

  async readDetail(slug: string, relatedLimit = 3): Promise<BlogPostDetailResult> {
    const post = await this.readMetadata(slug)
    if (!post) {
      return {
        post: null,
        relatedPosts: []
      }
    }

    const relatedPosts = await this.repository.findRelatedPosts(post, Math.max(relatedLimit, 1))

    return {
      post,
      relatedPosts
    }
  }

  async trackView(slug: string, context: BlogPostViewContext): Promise<void> {
    const post = await this.repository.findPostForViewTracking(slug)
    if (!post) return

    await this.repository.insertBlogView(post.id, context)
    await this.repository.incrementViewCount(post.id, post.view_count + 1)
  }

  async getRecommendations(slug: string, maxRecommendations = 3): Promise<BlogPost[]> {
    const currentPost = await this.readMetadata(slug)
    if (!currentPost) return []

    const allPosts = await this.repository.findPublishedPostsForRecommendations(currentPost.id)
    const normalizedPosts = allPosts.map(normalizeBlogPost)

    return getHybridRecommendations(currentPost, normalizedPosts, maxRecommendations)
  }
}

export function createBlogPostDetailService(repository: BlogPostDetailRepository): BlogPostDetailService {
  return new BlogPostDetailService(repository)
}

export function createSupabaseBlogPostDetailRepository(supabase: any): BlogPostDetailRepository {
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

    async findRelatedPosts(post: BlogPostWithRelations, limit: number): Promise<BlogPost[]> {
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
        const excludedIds = relatedPosts.map((relatedPost: BlogPostWithRelations) => relatedPost.id)
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
