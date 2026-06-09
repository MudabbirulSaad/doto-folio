import test from 'node:test'
import assert from 'node:assert/strict'
import { ApplicationError } from '../lib/server/domain/errors'
import {
  createAdminBlogCategory,
  deleteAdminBlogCategory,
  updateAdminBlogTag,
  type AdminBlogCategoryRecord,
  type AdminBlogTagRecord,
  type AdminBlogTaxonomyRepository
} from '../lib/server/application/blog/admin-blog-taxonomy'
import type { BlogCategory } from '../lib/types/blog'

function categoryRecord(overrides: Partial<AdminBlogCategoryRecord> & Pick<AdminBlogCategoryRecord, 'id' | 'name' | 'slug'>): AdminBlogCategoryRecord {
  return {
    description: null,
    color: '#3b82f6',
    display_order: 0,
    is_published: true,
    created_at: '2026-06-08T00:00:00.000Z',
    updated_at: '2026-06-08T00:00:00.000Z',
    ...overrides
  }
}

function categoryResponse(record: AdminBlogCategoryRecord): BlogCategory {
  const { post_count: postCount, ...category } = record
  return {
    ...category,
    post_count: typeof postCount === 'number' ? postCount : undefined
  }
}

function tagRecord(overrides: Partial<AdminBlogTagRecord> & Pick<AdminBlogTagRecord, 'id' | 'name' | 'slug'>): AdminBlogTagRecord {
  return {
    description: null,
    usage_count: 0,
    is_published: true,
    created_at: '2026-06-08T00:00:00.000Z',
    updated_at: '2026-06-08T00:00:00.000Z',
    ...overrides
  }
}

interface TestAdminBlogTaxonomyRepository extends AdminBlogTaxonomyRepository {
  categories: Record<string, AdminBlogCategoryRecord>
  tags: Record<string, AdminBlogTagRecord>
}

function repository(): TestAdminBlogTaxonomyRepository {
  return {
    categories: {
      existing: categoryRecord({ id: 'existing', name: 'Existing', slug: 'existing', post_count: [{ count: 2 }] })
    },
    tags: {
      tag1: tagRecord({ id: 'tag1', name: 'Old', slug: 'old', usage_count: 3 })
    },
    async listCategories() { return Object.values(this.categories).map(categoryResponse) },
    async listTags() { return Object.values(this.tags) },
    async findCategoryById(id) { return this.categories[id] || null },
    async findTagById(id) { return this.tags[id] || null },
    async findCategoryDuplicate(name, slug, excludeId) {
      return Object.values(this.categories).find((category) =>
        category.id !== excludeId && (category.name === name || category.slug === slug)
      ) || null
    },
    async findTagDuplicate(name, slug, excludeId) {
      return Object.values(this.tags).find((tag) =>
        tag.id !== excludeId && (tag.name === name || tag.slug === slug)
      ) || null
    },
    async createCategory(data) {
      const category = categoryRecord({
        id: 'cat2',
        name: String(data.name),
        slug: String(data.slug),
        description: typeof data.description === 'string' ? data.description : null,
        color: String(data.color),
        display_order: Number(data.display_order),
        is_published: data.is_published === true
      })
      this.categories.cat2 = category
      return categoryResponse(category)
    },
    async updateCategory(id, data) {
      const category = categoryRecord({ ...this.categories[id], ...data })
      this.categories[id] = category
      return categoryResponse(category)
    },
    async deleteCategory(id) { delete this.categories[id] },
    async clearCategoryFromPosts(id) { this.categories[id].cleared = true },
    async createTag(data) {
      this.tags.tag2 = tagRecord({
        id: 'tag2',
        name: String(data.name),
        slug: String(data.slug),
        description: typeof data.description === 'string' ? data.description : null,
        usage_count: Number(data.usage_count),
        is_published: data.is_published === true
      })
      return this.tags.tag2
    },
    async updateTag(id, data) {
      this.tags[id] = tagRecord({ ...this.tags[id], ...data })
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
