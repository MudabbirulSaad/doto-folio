import type { CreateBlogPostData } from '@/lib/types/blog'
import { ApplicationError } from '@/lib/server/domain/errors'

type BlogPostStatus = 'draft' | 'published' | 'archived'

export interface BlogPostForLifecycle {
  id: string
  slug: string
  category_id?: string | null
  status?: BlogPostStatus
  published_at?: string | null
}

export interface BlogPostForDelete {
  id: string
  title: string
  category_id?: string | null
  tag_ids: string[]
}

export interface BlogPostWorkflowRepository {
  findPostBySlug(slug: string, excludeId?: string): Promise<{ id: string } | null>
  findPostForUpdate(id: string): Promise<BlogPostForLifecycle | null>
  findPostForDelete(id: string): Promise<BlogPostForDelete | null>
  createPost(data: Record<string, unknown>): Promise<any>
  updatePost(id: string, data: Record<string, unknown>): Promise<any>
  deletePost(id: string): Promise<void>
  getPostTagIds(id: string): Promise<string[]>
  replacePostTags(id: string, tagIds: string[]): Promise<void>
  refreshCategoryPostCounts(categoryIds: string[]): Promise<void>
  refreshTagUsageCounts(): Promise<void>
}

export class BlogPostWorkflowError extends ApplicationError {
  constructor(
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR',
    message: string,
    details: string[] = [message]
  ) {
    super(code, message, details)
    this.name = 'BlogPostWorkflowError'
  }
}

interface WorkflowOptions {
  now?: () => Date
}

type UpdateBlogPostWorkflowData = Partial<CreateBlogPostData> & {
  is_featured?: boolean
}

function requireNonBlank(value: unknown, message: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BlogPostWorkflowError('VALIDATION_ERROR', message)
  }
}

function trimNullable(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function trimRequired(value: string) {
  return value.trim()
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ')
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function truncateExcerpt(value: string, maxLength = 180) {
  const normalized = normalizeWhitespace(value)
  if (normalized.length <= maxLength) return normalized

  const truncated = normalized.slice(0, maxLength).replace(/\s+\S*$/, '').trim()
  return truncated || normalized.slice(0, maxLength).trim()
}

function excerptFromContent(content: string) {
  try {
    const contentData = JSON.parse(content)
    if (!Array.isArray(contentData.blocks)) return null

    const text = contentData.blocks
      .map((block: any) => stripHtml(String(block.data?.text || block.data?.caption || '')))
      .join(' ')

    return truncateExcerpt(text) || null
  } catch {
    return truncateExcerpt(stripHtml(content)) || null
  }
}

export function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
}

export function calculateReadingTime(content: string) {
  try {
    const contentData = JSON.parse(content)
    if (!Array.isArray(contentData.blocks)) return 5

    const wordCount = contentData.blocks
      .filter((block: any) => block.type === 'paragraph' || block.type === 'header')
      .reduce((count: number, block: any) => {
        const text = String(block.data?.text || '').replace(/<[^>]*>/g, ' ')
        const words = text.trim().split(/\s+/).filter(Boolean)
        return count + words.length
      }, 0)

    return Math.max(1, Math.ceil(wordCount / 200))
  } catch {
    return 5
  }
}

async function assertSlugIsUnique(repository: BlogPostWorkflowRepository, slug: string, excludeId?: string) {
  const existingPost = await repository.findPostBySlug(slug, excludeId)
  if (existingPost) {
    throw new BlogPostWorkflowError('VALIDATION_ERROR', 'A post with this slug already exists')
  }
}

export async function createBlogPost(
  repository: BlogPostWorkflowRepository,
  input: CreateBlogPostData,
  options: WorkflowOptions = {}
) {
  requireNonBlank(input.title, 'Title is required')
  requireNonBlank(input.slug, 'Slug is required')
  requireNonBlank(input.content, 'Content is required')

  const excerpt = trimNullable(input.excerpt) || excerptFromContent(input.content)
  if (!excerpt) {
    throw new BlogPostWorkflowError('VALIDATION_ERROR', 'Excerpt is required')
  }

  const slug = trimRequired(input.slug)
  await assertSlugIsUnique(repository, slug)

  const status = input.status || 'draft'
  const categoryId = input.category_id || null
  const tagIds = input.tag_ids || []
  const now = (options.now || (() => new Date()))().toISOString()

  const post = await repository.createPost({
    title: trimRequired(input.title),
    slug,
    excerpt: trimRequired(excerpt),
    content: trimRequired(input.content),
    category_id: categoryId,
    status,
    featured: Boolean(input.featured),
    meta_title: trimNullable(input.meta_title),
    meta_description: trimNullable(input.meta_description),
    reading_time: calculateReadingTime(input.content),
    published_at: status === 'published' ? now : null
  })

  if (tagIds.length > 0) {
    await repository.replacePostTags(post.id, tagIds)
    await repository.refreshTagUsageCounts()
  }

  if (categoryId) {
    await repository.refreshCategoryPostCounts([categoryId])
  }

  return post
}

export async function updateBlogPost(
  repository: BlogPostWorkflowRepository,
  id: string,
  input: UpdateBlogPostWorkflowData,
  options: WorkflowOptions = {}
) {
  const existingPost = await repository.findPostForUpdate(id)
  if (!existingPost) {
    throw new BlogPostWorkflowError('NOT_FOUND', 'Post not found')
  }

  if (input.title !== undefined) requireNonBlank(input.title, 'Title is required')
  if (input.slug !== undefined) requireNonBlank(input.slug, 'Slug is required')
  if (input.excerpt !== undefined) requireNonBlank(input.excerpt, 'Excerpt is required')
  if (input.content !== undefined) requireNonBlank(input.content, 'Content is required')

  if (input.slug !== undefined && input.slug.trim() !== existingPost.slug) {
    await assertSlugIsUnique(repository, input.slug.trim(), id)
  }

  const updateData: Record<string, unknown> = {
    updated_at: (options.now || (() => new Date()))().toISOString()
  }

  if (input.title !== undefined) updateData.title = input.title.trim()
  if (input.slug !== undefined) updateData.slug = input.slug.trim()
  if (input.excerpt !== undefined) updateData.excerpt = input.excerpt.trim()
  if (input.content !== undefined) {
    updateData.content = input.content.trim()
    updateData.reading_time = calculateReadingTime(input.content)
  }
  if (input.category_id !== undefined) updateData.category_id = input.category_id || null
  if (input.status !== undefined) {
    updateData.status = input.status
    if (input.status === 'published' && !existingPost.published_at) {
      updateData.published_at = updateData.updated_at
    }
  }
  if (input.featured !== undefined || input.is_featured !== undefined) {
    updateData.featured = Boolean(input.featured ?? input.is_featured)
  }
  if (input.meta_title !== undefined) updateData.meta_title = trimNullable(input.meta_title)
  if (input.meta_description !== undefined) updateData.meta_description = trimNullable(input.meta_description)

  const post = await repository.updatePost(id, updateData)

  if (input.tag_ids !== undefined) {
    await repository.replacePostTags(id, input.tag_ids)
    await repository.refreshTagUsageCounts()
  }

  const nextCategoryId = input.category_id !== undefined ? input.category_id || null : existingPost.category_id || null
  const statusChanged = input.status !== undefined && input.status !== existingPost.status
  const categoryChanged = input.category_id !== undefined && nextCategoryId !== (existingPost.category_id || null)
  if (statusChanged || categoryChanged) {
    await repository.refreshCategoryPostCounts(uniqueValues([existingPost.category_id, nextCategoryId]))
  }

  return post
}

export async function deleteBlogPost(repository: BlogPostWorkflowRepository, id: string) {
  const post = await repository.findPostForDelete(id)
  if (!post) {
    throw new BlogPostWorkflowError('NOT_FOUND', 'Post not found')
  }

  await repository.deletePost(id)

  if (post.tag_ids.length > 0) {
    await repository.refreshTagUsageCounts()
  }

  if (post.category_id) {
    await repository.refreshCategoryPostCounts([post.category_id])
  }

  return {
    message: 'Post deleted successfully',
    title: post.title
  }
}
