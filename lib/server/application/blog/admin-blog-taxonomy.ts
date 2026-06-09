import { ApplicationError } from '@/lib/server/domain/errors'
import type {
  BlogCategory,
  BlogTag,
  CreateBlogCategoryData,
  CreateBlogTagData,
  UpdateBlogCategoryData,
  UpdateBlogTagData
} from '@/lib/types/blog'

export type AdminBlogCategoryRecord =
  | BlogCategory
  | (Omit<BlogCategory, 'post_count'> & { post_count?: Array<{ count: number }> })

export type AdminBlogTagRecord = BlogTag

export interface AdminBlogTaxonomyDuplicate {
  id: string
  name: string
  slug: string
}

export interface AdminBlogTaxonomyRepository {
  listCategories(): Promise<BlogCategory[]>
  listTags(): Promise<BlogTag[]>
  findCategoryById(id: string): Promise<AdminBlogCategoryRecord | null>
  findTagById(id: string): Promise<AdminBlogTagRecord | null>
  findCategoryDuplicate(name: string, slug: string, excludeId?: string): Promise<AdminBlogTaxonomyDuplicate | null>
  findTagDuplicate(name: string, slug: string, excludeId?: string): Promise<AdminBlogTaxonomyDuplicate | null>
  createCategory(data: Record<string, unknown>): Promise<BlogCategory>
  updateCategory(id: string, data: Record<string, unknown>): Promise<BlogCategory>
  deleteCategory(id: string): Promise<void>
  clearCategoryFromPosts(id: string): Promise<void>
  createTag(data: Record<string, unknown>): Promise<BlogTag>
  updateTag(id: string, data: Record<string, unknown>): Promise<BlogTag>
  deleteTag(id: string): Promise<void>
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

function requireText(value: unknown, message: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApplicationError('VALIDATION_ERROR', 'Validation failed', [message])
  }
}

function validateSlug(slug: string) {
  if (!SLUG_PATTERN.test(slug)) {
    throw new ApplicationError('VALIDATION_ERROR', 'Validation failed', ['Slug must contain only lowercase letters, numbers, and hyphens'])
  }
}

function validateColor(color: string) {
  if (!COLOR_PATTERN.test(color)) {
    throw new ApplicationError('VALIDATION_ERROR', 'Validation failed', ['Color must be a valid hex color (e.g., #3b82f6)'])
  }
}

function trimNullable(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function categoryPostCount(category: AdminBlogCategoryRecord) {
  if (typeof category.post_count === 'number') {
    return category.post_count
  }

  return category.post_count?.[0]?.count || 0
}

async function assertCategoryDuplicateFree(repository: AdminBlogTaxonomyRepository, name: string, slug: string, excludeId?: string) {
  const duplicate = await repository.findCategoryDuplicate(name, slug, excludeId)
  if (!duplicate) return

  if (duplicate.name === name) {
    throw new ApplicationError('VALIDATION_ERROR', 'Validation failed', ['A category with this name already exists'])
  }
  if (duplicate.slug === slug) {
    throw new ApplicationError('VALIDATION_ERROR', 'Validation failed', ['A category with this slug already exists'])
  }
}

async function assertTagDuplicateFree(repository: AdminBlogTaxonomyRepository, name: string, slug: string, excludeId?: string) {
  const duplicate = await repository.findTagDuplicate(name, slug, excludeId)
  if (!duplicate) return

  if (duplicate.name === name) {
    throw new ApplicationError('VALIDATION_ERROR', 'Validation failed', ['A tag with this name already exists'])
  }
  if (duplicate.slug === slug) {
    throw new ApplicationError('VALIDATION_ERROR', 'Validation failed', ['A tag with this slug already exists'])
  }
}

export function listAdminBlogCategories(repository: AdminBlogTaxonomyRepository) {
  return repository.listCategories()
}

export function listAdminBlogTags(repository: AdminBlogTaxonomyRepository) {
  return repository.listTags()
}

export async function getAdminBlogCategory(repository: AdminBlogTaxonomyRepository, id: string) {
  const category = await repository.findCategoryById(id)
  if (!category) throw new ApplicationError('NOT_FOUND', 'Category not found')
  return category
}

export async function getAdminBlogTag(repository: AdminBlogTaxonomyRepository, id: string) {
  const tag = await repository.findTagById(id)
  if (!tag) throw new ApplicationError('NOT_FOUND', 'Tag not found')
  return tag
}

export async function createAdminBlogCategory(repository: AdminBlogTaxonomyRepository, input: CreateBlogCategoryData) {
  requireText(input.name, 'Name is required')
  requireText(input.slug, 'Slug is required')

  const name = input.name.trim()
  const slug = input.slug.trim()
  const color = input.color || '#3b82f6'
  validateSlug(slug)
  validateColor(color)
  await assertCategoryDuplicateFree(repository, name, slug)

  return repository.createCategory({
    name,
    slug,
    description: trimNullable(input.description),
    color,
    display_order: input.display_order || 0,
    is_published: true
  })
}

export async function updateAdminBlogCategory(repository: AdminBlogTaxonomyRepository, id: string, input: UpdateBlogCategoryData) {
  await getAdminBlogCategory(repository, id)
  requireText(input.name, 'Name is required')
  requireText(input.slug, 'Slug is required')

  const name = input.name!.trim()
  const slug = input.slug!.trim()
  const color = input.color || '#3b82f6'
  validateSlug(slug)
  validateColor(color)
  await assertCategoryDuplicateFree(repository, name, slug, id)

  return repository.updateCategory(id, {
    name,
    slug,
    description: trimNullable(input.description),
    color,
    display_order: input.display_order || 0,
    updated_at: new Date().toISOString()
  })
}

export async function deleteAdminBlogCategory(repository: AdminBlogTaxonomyRepository, id: string) {
  const category = await getAdminBlogCategory(repository, id)
  const postCount = categoryPostCount(category)

  if (postCount > 0) {
    await repository.clearCategoryFromPosts(id)
  }

  await repository.deleteCategory(id)
  return {
    message: 'Category deleted successfully',
    postsUpdated: postCount
  }
}

export async function createAdminBlogTag(repository: AdminBlogTaxonomyRepository, input: CreateBlogTagData) {
  requireText(input.name, 'Name is required')
  requireText(input.slug, 'Slug is required')

  const name = input.name.trim()
  const slug = input.slug.trim()
  validateSlug(slug)
  await assertTagDuplicateFree(repository, name, slug)

  return repository.createTag({
    name,
    slug,
    description: trimNullable(input.description),
    usage_count: 0,
    is_published: true
  })
}

export async function updateAdminBlogTag(repository: AdminBlogTaxonomyRepository, id: string, input: UpdateBlogTagData) {
  await getAdminBlogTag(repository, id)
  requireText(input.name, 'Name is required')
  requireText(input.slug, 'Slug is required')

  const name = input.name!.trim()
  const slug = input.slug!.trim()
  validateSlug(slug)
  await assertTagDuplicateFree(repository, name, slug, id)

  return repository.updateTag(id, {
    name,
    slug,
    description: trimNullable(input.description),
    updated_at: new Date().toISOString()
  })
}

export async function deleteAdminBlogTag(repository: AdminBlogTaxonomyRepository, id: string) {
  const tag = await getAdminBlogTag(repository, id)
  await repository.deleteTag(id)

  return {
    message: 'Tag deleted successfully',
    postsAffected: tag.usage_count
  }
}
