import { describe, expect, it, vi } from 'vitest'
import {
  categoryToForm,
  deleteAdminBlogCategory,
  deleteAdminBlogTag,
  emptyCategoryForm,
  emptyTagForm,
  loadAdminBlogCategories,
  loadAdminBlogTags,
  saveAdminBlogCategory,
  saveAdminBlogTag,
  tagToForm,
  type AdminBlogTaxonomyGateway
} from '@/lib/client/application/admin/blog-taxonomy'

const category = {
  id: 'category-1',
  name: 'AI',
  slug: 'ai',
  description: 'Artificial intelligence',
  color: '#3b82f6',
  display_order: 1,
  is_published: true,
  created_at: '2026-06-09T00:00:00.000Z',
  updated_at: '2026-06-09T00:00:00.000Z',
  post_count: 2
}

const tag = {
  id: 'tag-1',
  name: 'React',
  slug: 'react',
  description: 'React posts',
  usage_count: 3,
  is_published: true,
  created_at: '2026-06-09T00:00:00.000Z',
  updated_at: '2026-06-09T00:00:00.000Z'
}

function gateway(): AdminBlogTaxonomyGateway {
  return {
    listCategories: vi.fn(async () => [category]),
    createCategory: vi.fn(async input => ({ ...category, ...input })),
    updateCategory: vi.fn(async (_id, input) => ({ ...category, ...input })),
    deleteCategory: vi.fn(async () => undefined),
    listTags: vi.fn(async () => [tag]),
    createTag: vi.fn(async input => ({ ...tag, ...input })),
    updateTag: vi.fn(async (_id, input) => ({ ...tag, ...input })),
    deleteTag: vi.fn(async () => undefined)
  }
}

describe('admin blog taxonomy workflow', () => {
  it('loads categories and tags through the gateway', async () => {
    const api = gateway()

    await expect(loadAdminBlogCategories(api)).resolves.toEqual({
      success: true,
      categories: [category]
    })
    await expect(loadAdminBlogTags(api)).resolves.toEqual({
      success: true,
      tags: [tag]
    })
  })

  it('maps taxonomy records to forms and validates required fields', async () => {
    const api = gateway()

    expect(categoryToForm(category)).toEqual({
      name: 'AI',
      slug: 'ai',
      description: 'Artificial intelligence',
      color: '#3b82f6',
      display_order: 1
    })
    expect(tagToForm(tag)).toEqual({
      name: 'React',
      slug: 'react',
      description: 'React posts'
    })

    await expect(saveAdminBlogCategory(api, emptyCategoryForm())).resolves.toEqual({
      success: false,
      error: 'Name and slug are required'
    })
    await expect(saveAdminBlogTag(api, emptyTagForm())).resolves.toEqual({
      success: false,
      error: 'Name and slug are required'
    })
  })

  it('saves and deletes categories and tags through the gateway', async () => {
    const api = gateway()

    await expect(saveAdminBlogCategory(api, { ...emptyCategoryForm(), name: 'AI', slug: 'ai' })).resolves.toMatchObject({
      success: true,
      category: { name: 'AI' }
    })
    await expect(saveAdminBlogCategory(api, categoryToForm(category), 'category-1')).resolves.toMatchObject({
      success: true,
      category: { id: 'category-1' }
    })
    await expect(deleteAdminBlogCategory(api, 'category-1')).resolves.toEqual({
      success: true,
      id: 'category-1'
    })

    await expect(saveAdminBlogTag(api, { ...emptyTagForm(), name: 'React', slug: 'react' })).resolves.toMatchObject({
      success: true,
      tag: { name: 'React' }
    })
    await expect(saveAdminBlogTag(api, tagToForm(tag), 'tag-1')).resolves.toMatchObject({
      success: true,
      tag: { id: 'tag-1' }
    })
    await expect(deleteAdminBlogTag(api, 'tag-1')).resolves.toEqual({
      success: true,
      id: 'tag-1'
    })
  })
})
