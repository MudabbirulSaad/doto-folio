import type { BlogCategory, BlogTag, BlogPost, BlogPostWithRelations } from '@/lib/types/blog'
import { getHybridRecommendations } from '@/lib/server/application/blog/recommendations'

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

function normalizeTag(tagOrRelation: RawTagRelation): BlogTag | null {
  if (!tagOrRelation) return null
  if ('tag' in tagOrRelation) return tagOrRelation.tag as BlogTag
  return tagOrRelation as BlogTag
}

export function normalizeBlogPost(rawPost: BlogPostRaw): BlogPostWithRelations {
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
