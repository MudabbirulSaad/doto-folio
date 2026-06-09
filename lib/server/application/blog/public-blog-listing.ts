import type { BlogCategory, BlogPost, BlogPostWithRelations, BlogSearchParams, BlogTag } from '@/lib/types/blog'

export type PublicBlogPostRecord = BlogPost & {
  category?: BlogCategory | null
  tags?: Array<BlogTag | { tag?: BlogTag | null } | null> | null
  blog_categories?: BlogCategory | null
  blog_post_tags?: Array<{ blog_tags?: BlogTag | null; tag?: BlogTag | null } | null> | null
}

export interface PublicBlogListingRepository {
  getPublishedPosts(): Promise<PublicBlogPostRecord[]>
  getCategories(): Promise<BlogCategory[]>
  getPopularTags(limit: number): Promise<BlogTag[]>
}

export interface PublicBlogListingResult {
  posts: BlogPostWithRelations[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
  categories: BlogCategory[]
  tags: BlogTag[]
}

type SortableBlogPostKey = NonNullable<BlogSearchParams['sortBy']>

function normalizePositiveInteger(value: number | undefined, fallback: number, maximum?: number) {
  if (!Number.isFinite(value) || !value || value < 1) return fallback
  const normalized = Math.floor(value)
  return maximum ? Math.min(normalized, maximum) : normalized
}

function getPostCategory(post: PublicBlogPostRecord): BlogCategory | null {
  return post.category || post.blog_categories || null
}

function getPostTags(post: PublicBlogPostRecord): BlogTag[] {
  if (post.tags) {
    return post.tags
      .map(tagRelation => {
        if (!tagRelation) return null
        return 'tag' in tagRelation ? tagRelation.tag || null : tagRelation
      })
      .filter((tag): tag is BlogTag => Boolean(tag))
  }

  return (post.blog_post_tags || [])
    .map(tagRelation => tagRelation?.tag || tagRelation?.blog_tags || null)
    .filter((tag): tag is BlogTag => Boolean(tag))
}

function normalizePost(post: PublicBlogPostRecord): BlogPostWithRelations {
  const normalizedPost = { ...post }
  delete normalizedPost.blog_categories
  delete normalizedPost.blog_post_tags

  return {
    ...normalizedPost,
    category: getPostCategory(post),
    tags: getPostTags(post)
  }
}

function postMatchesSearch(post: BlogPost, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  return [post.title, post.excerpt, post.content]
    .filter(Boolean)
    .some(value => value.toLowerCase().includes(normalizedQuery))
}

function compareValues(left: string | number | undefined, right: string | number | undefined) {
  if (typeof left === 'number' || typeof right === 'number') {
    return (left as number | undefined || 0) - (right as number | undefined || 0)
  }

  return String(left || '').localeCompare(String(right || ''))
}

function getSortValue(post: BlogPost, sortBy: SortableBlogPostKey): string | number | undefined {
  switch (sortBy) {
    case 'published_at':
      return post.published_at || post.created_at
    case 'updated_at':
      return post.updated_at
    case 'view_count':
      return post.view_count
    case 'title':
      return post.title
    case 'created_at':
    default:
      return post.created_at
  }
}

export async function getPublicBlogListing(
  repository: PublicBlogListingRepository,
  params: BlogSearchParams = {},
  options: { defaultLimit?: number; maxLimit?: number; tagLimit?: number } = {}
): Promise<PublicBlogListingResult> {
  const defaultLimit = options.defaultLimit || 10
  const page = normalizePositiveInteger(params.page, 1)
  const limit = normalizePositiveInteger(params.limit, defaultLimit, options.maxLimit)
  const tagLimit = normalizePositiveInteger(options.tagLimit, 20)
  const sortBy = params.sortBy || 'published_at'
  const sortOrder = params.sortOrder || 'desc'

  const [rawPosts, categories, tags] = await Promise.all([
    repository.getPublishedPosts(),
    repository.getCategories(),
    repository.getPopularTags(tagLimit)
  ])

  const normalizedPosts = rawPosts
    .filter(post => post.status === 'published')
    .map(normalizePost)

  const filteredPosts = normalizedPosts.filter(post => {
    if (params.category && post.category?.slug !== params.category) return false
    if (params.tag && !(post.tags || []).some(tag => tag.slug === params.tag)) return false
    if (params.featured && !post.featured) return false
    if (params.query && !postMatchesSearch(post, params.query)) return false
    return true
  })

  const sortedPosts = [...filteredPosts].sort((leftPost, rightPost) => {
    const comparison = compareValues(
      getSortValue(leftPost, sortBy),
      getSortValue(rightPost, sortBy)
    )

    return sortOrder === 'asc' ? comparison : -comparison
  })

  const total = sortedPosts.length
  const offset = (page - 1) * limit
  const paginatedPosts = sortedPosts.slice(offset, offset + limit)
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

  return {
    posts: paginatedPosts,
    total,
    page,
    limit,
    totalPages,
    hasMore: offset + limit < total,
    categories,
    tags
  }
}
