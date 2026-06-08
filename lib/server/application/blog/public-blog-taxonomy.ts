import { ApplicationError } from '@/lib/server/domain/errors'
import type { BlogCategory, BlogCategoryResponse, BlogPost, BlogTag, BlogTagResponse } from '@/lib/types/blog'

export type CategoryWithRawCount = BlogCategory & {
  posts?: Array<{ count?: number } | null> | null
}

export interface BlogTaxonomyRepository {
  getCategoriesWithPostCounts(): Promise<CategoryWithRawCount[]>
  findCategoryBySlug(slug: string): Promise<BlogCategory | null>
  findTagBySlug(slug: string): Promise<BlogTag | null>
  getPublishedPostsByCategoryId(categoryId: string, page: number, limit: number): Promise<{ posts: BlogPost[]; total: number }>
  getPostIdsByTagId(tagId: string): Promise<string[]>
  getPublishedPostsByIds(postIds: string[], page: number, limit: number): Promise<{ posts: BlogPost[]; total: number }>
}

function normalizePositiveInteger(value: number | undefined, fallback: number, maximum?: number) {
  if (!Number.isFinite(value) || !value || value < 1) return fallback
  const normalized = Math.floor(value)
  return maximum ? Math.min(normalized, maximum) : normalized
}

function normalizePost(post: BlogPost): BlogPost {
  return {
    ...post,
    category: post.category || null,
    tags: post.tags?.map(tagRelation => 'tag' in tagRelation ? tagRelation.tag : tagRelation).filter(Boolean) || []
  }
}

export async function getBlogCategoriesWithCounts(repository: BlogTaxonomyRepository) {
  const categories = await repository.getCategoriesWithPostCounts()

  return categories.map(category => {
    const { posts, ...rest } = category
    return {
      ...rest,
      post_count: posts?.[0]?.count || 0
    }
  })
}

export async function getBlogPostsByCategory(
  repository: BlogTaxonomyRepository,
  slug: string,
  params: { page?: number; limit?: number } = {}
): Promise<BlogCategoryResponse> {
  const page = normalizePositiveInteger(params.page, 1)
  const limit = normalizePositiveInteger(params.limit, 12, 50)
  const category = await repository.findCategoryBySlug(slug)

  if (!category) {
    throw new ApplicationError('NOT_FOUND', 'Blog category not found')
  }

  const { posts, total } = await repository.getPublishedPostsByCategoryId(category.id, page, limit)

  return {
    category,
    posts: posts.map(normalizePost),
    total,
    page,
    limit,
    hasMore: page * limit < total
  }
}

export async function getBlogPostsByTag(
  repository: BlogTaxonomyRepository,
  slug: string,
  params: { page?: number; limit?: number } = {}
): Promise<BlogTagResponse> {
  const page = normalizePositiveInteger(params.page, 1)
  const limit = normalizePositiveInteger(params.limit, 12, 50)
  const tag = await repository.findTagBySlug(slug)

  if (!tag) {
    throw new ApplicationError('NOT_FOUND', 'Blog tag not found')
  }

  const postIds = await repository.getPostIdsByTagId(tag.id)
  if (postIds.length === 0) {
    return {
      tag,
      posts: [],
      total: 0,
      page,
      limit,
      hasMore: false
    }
  }

  const { posts, total } = await repository.getPublishedPostsByIds(postIds, page, limit)

  return {
    tag,
    posts: posts.map(normalizePost),
    total,
    page,
    limit,
    hasMore: page * limit < total
  }
}
