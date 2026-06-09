import type {
  AdminBlogCategory,
  AdminBlogCategoryFormData,
  AdminBlogTagFormData
} from '@/lib/client/domain/admin-blog'
import type { BlogTag } from '@/lib/types/blog'

export interface AdminBlogTaxonomyGateway {
  listCategories(): Promise<AdminBlogCategory[]>
  createCategory(input: AdminBlogCategoryFormData): Promise<AdminBlogCategory>
  updateCategory(id: string, input: AdminBlogCategoryFormData): Promise<AdminBlogCategory>
  deleteCategory(id: string): Promise<void>
  listTags(): Promise<BlogTag[]>
  createTag(input: AdminBlogTagFormData): Promise<BlogTag>
  updateTag(id: string, input: AdminBlogTagFormData): Promise<BlogTag>
  deleteTag(id: string): Promise<void>
}

function workflowError(error: unknown, fallback: string) {
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback
  }
}

export function emptyCategoryForm(): AdminBlogCategoryFormData {
  return {
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
    display_order: 0
  }
}

export function emptyTagForm(): AdminBlogTagFormData {
  return {
    name: '',
    slug: '',
    description: ''
  }
}

export function categoryToForm(category: AdminBlogCategory): AdminBlogCategoryFormData {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    color: category.color,
    display_order: category.display_order
  }
}

export function tagToForm(tag: BlogTag): AdminBlogTagFormData {
  return {
    name: tag.name,
    slug: tag.slug,
    description: tag.description || ''
  }
}

export async function loadAdminBlogCategories(gateway: AdminBlogTaxonomyGateway) {
  try {
    return {
      success: true as const,
      categories: await gateway.listCategories()
    }
  } catch (error) {
    return workflowError(error, 'Failed to load categories')
  }
}

export async function loadAdminBlogTags(gateway: AdminBlogTaxonomyGateway) {
  try {
    return {
      success: true as const,
      tags: await gateway.listTags()
    }
  } catch (error) {
    return workflowError(error, 'Failed to load tags')
  }
}

export async function saveAdminBlogCategory(
  gateway: AdminBlogTaxonomyGateway,
  input: AdminBlogCategoryFormData,
  id?: string
) {
  if (!input.name.trim() || !input.slug.trim()) {
    return { success: false as const, error: 'Name and slug are required' }
  }

  const payload = {
    ...input,
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description.trim()
  }

  try {
    const category = id
      ? await gateway.updateCategory(id, payload)
      : await gateway.createCategory(payload)
    return { success: true as const, category }
  } catch (error) {
    return workflowError(error, 'Failed to save category')
  }
}

export async function saveAdminBlogTag(
  gateway: AdminBlogTaxonomyGateway,
  input: AdminBlogTagFormData,
  id?: string
) {
  if (!input.name.trim() || !input.slug.trim()) {
    return { success: false as const, error: 'Name and slug are required' }
  }

  const payload = {
    ...input,
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description.trim()
  }

  try {
    const tag = id
      ? await gateway.updateTag(id, payload)
      : await gateway.createTag(payload)
    return { success: true as const, tag }
  } catch (error) {
    return workflowError(error, 'Failed to save tag')
  }
}

export async function deleteAdminBlogCategory(gateway: AdminBlogTaxonomyGateway, id: string) {
  try {
    await gateway.deleteCategory(id)
    return { success: true as const, id }
  } catch (error) {
    return workflowError(error, 'Failed to delete category')
  }
}

export async function deleteAdminBlogTag(gateway: AdminBlogTaxonomyGateway, id: string) {
  try {
    await gateway.deleteTag(id)
    return { success: true as const, id }
  } catch (error) {
    return workflowError(error, 'Failed to delete tag')
  }
}
