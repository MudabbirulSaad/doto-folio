import { ApplicationError } from '@/lib/server/domain/errors'

export interface AdminBlogPostListParams {
  page?: number
  limit?: number
  status?: string | null
  category?: string | null
  search?: string | null
}

export interface AdminBlogPostRecord {
  id: string
  title: string
  [key: string]: unknown
}

export interface AdminBlogPostListResult {
  posts: AdminBlogPostRecord[]
  total: number
}

export type NormalizedAdminBlogPostListParams =
  Required<Pick<AdminBlogPostListParams, 'page' | 'limit'>> &
  Omit<AdminBlogPostListParams, 'page' | 'limit'>

export interface AdminBlogPostRepository {
  listPosts(params: NormalizedAdminBlogPostListParams): Promise<AdminBlogPostListResult>
  findPostById(id: string): Promise<AdminBlogPostRecord | null>
}

function normalizePositiveInteger(value: number | undefined, fallback: number, maximum?: number) {
  if (!Number.isFinite(value) || !value || value < 1) return fallback
  const normalized = Math.floor(value)
  return maximum ? Math.min(normalized, maximum) : normalized
}

export async function listAdminBlogPosts(repository: AdminBlogPostRepository, params: AdminBlogPostListParams = {}) {
  const page = normalizePositiveInteger(params.page, 1)
  const limit = normalizePositiveInteger(params.limit, 50, 100)
  const { posts, total } = await repository.listPosts({
    ...params,
    page,
    limit
  })

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: total > (page - 1) * limit + limit
    }
  }
}

export async function getAdminBlogPost(repository: AdminBlogPostRepository, id: string) {
  const post = await repository.findPostById(id)
  if (!post) {
    throw new ApplicationError('NOT_FOUND', 'Post not found')
  }

  return post
}
