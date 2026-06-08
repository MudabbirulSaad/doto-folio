import test from 'node:test'
import assert from 'node:assert/strict'
import { ApplicationError } from '../lib/server/domain/errors'
import {
  getBlogCategoriesWithCounts,
  getBlogPostsByCategory,
  getBlogPostsByTag,
  type BlogTaxonomyRepository
} from '../lib/server/application/blog/public-blog-taxonomy'
import type { BlogCategory, BlogPost, BlogTag } from '../lib/types/blog'

const category: BlogCategory = {
  id: 'cat-1',
  name: 'AI',
  slug: 'ai',
  color: '#00aaff',
  display_order: 1,
  is_published: true,
  created_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-06-01T00:00:00.000Z'
}

const tag: BlogTag = {
  id: 'tag-1',
  name: 'TypeScript',
  slug: 'typescript',
  usage_count: 1,
  is_published: true,
  created_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-06-01T00:00:00.000Z'
}

const post: BlogPost = {
  id: 'post-1',
  title: 'Post',
  slug: 'post',
  excerpt: 'Excerpt',
  content: 'Content',
  author_name: 'Saad',
  author_bio: 'Bio',
  status: 'published',
  featured: false,
  view_count: 0,
  reading_time: 1,
  published_at: '2026-06-01T00:00:00.000Z',
  created_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-06-01T00:00:00.000Z',
  category,
  tags: [{ tag }]
}

function repository(): BlogTaxonomyRepository {
  return {
    async getCategoriesWithPostCounts() {
      return [{ ...category, posts: [{ count: 3 }] }]
    },
    async findCategoryBySlug(slug) {
      return slug === category.slug ? category : null
    },
    async findTagBySlug(slug) {
      return slug === tag.slug ? tag : null
    },
    async getPublishedPostsByCategoryId() {
      return { posts: [post], total: 1 }
    },
    async getPostIdsByTagId() {
      return ['post-1']
    },
    async getPublishedPostsByIds() {
      return { posts: [post], total: 1 }
    }
  }
}

test('getBlogCategoriesWithCounts normalizes category post counts', async () => {
  const categories = await getBlogCategoriesWithCounts(repository())

  assert.equal(categories[0].post_count, 3)
})

test('getBlogPostsByCategory returns paginated normalized posts for a category slug', async () => {
  const result = await getBlogPostsByCategory(repository(), 'ai', { page: 1, limit: 12 })

  assert.equal(result.category.slug, 'ai')
  assert.equal(result.total, 1)
  assert.equal(result.hasMore, false)
  assert.deepEqual(result.posts[0].tags?.map(tag => 'tag' in tag ? tag.tag.slug : tag.slug), ['typescript'])
})

test('getBlogPostsByTag returns empty results when the tag has no post relations', async () => {
  const emptyRepository = {
    ...repository(),
    async getPostIdsByTagId() {
      return []
    }
  }

  const result = await getBlogPostsByTag(emptyRepository, 'typescript', { page: 1, limit: 12 })

  assert.equal(result.total, 0)
  assert.deepEqual(result.posts, [])
})

test('taxonomy lookups reject missing slugs as not found application errors', async () => {
  await assert.rejects(
    () => getBlogPostsByCategory(repository(), 'missing'),
    (error: unknown) => error instanceof ApplicationError && error.code === 'NOT_FOUND'
  )

  await assert.rejects(
    () => getBlogPostsByTag(repository(), 'missing'),
    (error: unknown) => error instanceof ApplicationError && error.code === 'NOT_FOUND'
  )
})
