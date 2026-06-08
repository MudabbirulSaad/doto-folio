import test from 'node:test'
import assert from 'node:assert/strict'
import { ApplicationError } from '../lib/server/domain/errors'
import {
  createAdminBlogCategory,
  deleteAdminBlogCategory,
  updateAdminBlogTag,
  type AdminBlogTaxonomyRepository
} from '../lib/server/application/blog/admin-blog-taxonomy'

function repository(): AdminBlogTaxonomyRepository & { categories: Record<string, any>; tags: Record<string, any> } {
  return {
    categories: {
      existing: { id: 'existing', name: 'Existing', slug: 'existing', post_count: [{ count: 2 }] }
    },
    tags: {
      tag1: { id: 'tag1', name: 'Old', slug: 'old', usage_count: 3 }
    },
    async listCategories() { return Object.values(this.categories) },
    async listTags() { return Object.values(this.tags) },
    async findCategoryById(id) { return this.categories[id] || null },
    async findTagById(id) { return this.tags[id] || null },
    async findCategoryDuplicate(name, slug, excludeId) {
      return Object.values(this.categories).find((category: any) =>
        category.id !== excludeId && (category.name === name || category.slug === slug)
      ) || null
    },
    async findTagDuplicate(name, slug, excludeId) {
      return Object.values(this.tags).find((tag: any) =>
        tag.id !== excludeId && (tag.name === name || tag.slug === slug)
      ) || null
    },
    async createCategory(data) {
      this.categories.cat2 = { id: 'cat2', ...data }
      return this.categories.cat2
    },
    async updateCategory(id, data) {
      this.categories[id] = { ...this.categories[id], ...data }
      return this.categories[id]
    },
    async deleteCategory(id) { delete this.categories[id] },
    async clearCategoryFromPosts(id) { this.categories[id].cleared = true },
    async createTag(data) {
      this.tags.tag2 = { id: 'tag2', ...data }
      return this.tags.tag2
    },
    async updateTag(id, data) {
      this.tags[id] = { ...this.tags[id], ...data }
      return this.tags[id]
    },
    async deleteTag(id) { delete this.tags[id] }
  }
}

test('createAdminBlogCategory validates slug/color and rejects duplicate names', async () => {
  await assert.rejects(
    () => createAdminBlogCategory(repository(), { name: 'New', slug: 'Bad Slug', color: '#3b82f6', display_order: 0 }),
    (error: unknown) => error instanceof ApplicationError && error.details?.some(detail => detail.includes('Slug must contain')) === true
  )

  await assert.rejects(
    () => createAdminBlogCategory(repository(), { name: 'Existing', slug: 'new', color: '#3b82f6', display_order: 0 }),
    (error: unknown) => error instanceof ApplicationError && error.details?.some(detail => detail.includes('already exists')) === true
  )
})

test('createAdminBlogCategory trims values and applies published defaults', async () => {
  const category = await createAdminBlogCategory(repository(), {
    name: ' New ',
    slug: 'new',
    description: ' Notes ',
    color: '#3b82f6',
    display_order: 4
  })

  assert.equal(category.name, 'New')
  assert.equal(category.description, 'Notes')
  assert.equal(category.is_published, true)
})

test('updateAdminBlogTag validates duplicates and updates trimmed values', async () => {
  const repo = repository()
  repo.tags.other = { id: 'other', name: 'Other', slug: 'other' }

  await assert.rejects(
    () => updateAdminBlogTag(repo, 'tag1', { name: 'Other', slug: 'new' }),
    (error: unknown) => error instanceof ApplicationError && error.details?.some(detail => detail.includes('already exists')) === true
  )

  const tag = await updateAdminBlogTag(repo, 'tag1', { name: ' New ', slug: 'new', description: ' Desc ' })
  assert.equal(tag.name, 'New')
  assert.equal(tag.description, 'Desc')
})

test('deleteAdminBlogCategory clears posts before deleting and reports affected posts', async () => {
  const repo = repository()

  const result = await deleteAdminBlogCategory(repo, 'existing')

  assert.deepEqual(result, { message: 'Category deleted successfully', postsUpdated: 2 })
  assert.equal(repo.categories.existing, undefined)
})

test('admin taxonomy missing resources throw not found application errors', async () => {
  await assert.rejects(
    () => deleteAdminBlogCategory(repository(), 'missing'),
    (error: unknown) => error instanceof ApplicationError && error.code === 'NOT_FOUND'
  )
})
