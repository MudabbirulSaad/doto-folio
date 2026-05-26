import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getPublicBlogListing,
  type PublicBlogListingRepository,
  type PublicBlogPostRecord
} from '../lib/data/public-blog-listing'
import type { BlogCategory, BlogTag } from '../lib/types/blog'

const aiCategory = category('cat-ai', 'AI', 'ai', '#00aaff')
const devCategory = category('cat-dev', 'Development', 'development', '#ffaa00')
const mlTag = tag('tag-ml', 'Machine Learning', 'machine-learning')
const reactTag = tag('tag-react', 'React', 'react')
const opsTag = tag('tag-ops', 'Ops', 'ops')

function category(id: string, name: string, slug: string, color: string): BlogCategory {
  return {
    id,
    name,
    slug,
    color,
    display_order: 0,
    is_published: true,
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z'
  }
}

function tag(id: string, name: string, slug: string): BlogTag {
  return {
    id,
    name,
    slug,
    usage_count: 1,
    is_published: true,
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z'
  }
}

function post(overrides: Partial<PublicBlogPostRecord>): PublicBlogPostRecord {
  return {
    id: 'post',
    title: 'Post',
    slug: 'post',
    excerpt: 'Excerpt',
    content: 'Content',
    author_name: 'Saad',
    author_bio: 'Author bio',
    status: 'published',
    featured: false,
    view_count: 0,
    reading_time: 1,
    published_at: '2026-05-01T00:00:00.000Z',
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
    category_id: aiCategory.id,
    ...overrides
  }
}

function repository(posts: PublicBlogPostRecord[]): PublicBlogListingRepository {
  return {
    async getPublishedPosts() {
      return posts
    },
    async getCategories() {
      return [aiCategory, devCategory]
    },
    async getPopularTags() {
      return [mlTag, reactTag, opsTag]
    }
  }
}

const posts: PublicBlogPostRecord[] = [
  post({
    id: 'draft',
    title: 'Draft Post',
    slug: 'draft-post',
    status: 'draft',
    category: aiCategory,
    tags: [{ tag: mlTag }],
    published_at: '2026-05-05T00:00:00.000Z'
  }),
  post({
    id: 'ai-new',
    title: 'New AI Systems',
    slug: 'new-ai-systems',
    excerpt: 'Latest applied AI notes',
    featured: true,
    view_count: 9,
    category: aiCategory,
    tags: [{ tag: mlTag }],
    published_at: '2026-05-04T00:00:00.000Z'
  }),
  post({
    id: 'react',
    title: 'React Patterns',
    slug: 'react-patterns',
    excerpt: 'Frontend architecture',
    view_count: 20,
    blog_categories: devCategory,
    blog_post_tags: [{ blog_tags: reactTag }],
    published_at: '2026-05-03T00:00:00.000Z'
  }),
  post({
    id: 'ops',
    title: 'Deployment Notes',
    slug: 'deployment-notes',
    excerpt: 'Operations and release habits',
    view_count: 4,
    category: devCategory,
    tags: [opsTag],
    published_at: '2026-05-02T00:00:00.000Z'
  })
]

test('getPublicBlogListing returns published posts with normalized category and tags', async () => {
  const result = await getPublicBlogListing(repository(posts))

  assert.deepEqual(result.posts.map(post => post.id), ['ai-new', 'react', 'ops'])
  assert.equal(result.total, 3)
  assert.equal(result.hasMore, false)
  assert.equal(result.posts[0].category?.slug, 'ai')
  assert.deepEqual(result.posts.map(post => post.tags?.map(tag => tag.slug)), [
    ['machine-learning'],
    ['react'],
    ['ops']
  ])
})

test('getPublicBlogListing defaults to published_at descending', async () => {
  const result = await getPublicBlogListing(repository([
    post({
      id: 'newly-created-older-publication',
      title: 'Newly Created Older Publication',
      slug: 'newly-created-older-publication',
      category: aiCategory,
      tags: [mlTag],
      published_at: '2026-05-01T00:00:00.000Z',
      created_at: '2026-05-10T00:00:00.000Z'
    }),
    post({
      id: 'older-created-newer-publication',
      title: 'Older Created Newer Publication',
      slug: 'older-created-newer-publication',
      category: devCategory,
      tags: [reactTag],
      published_at: '2026-05-09T00:00:00.000Z',
      created_at: '2026-05-02T00:00:00.000Z'
    })
  ]))

  assert.deepEqual(result.posts.map(post => post.id), [
    'older-created-newer-publication',
    'newly-created-older-publication'
  ])
})

test('getPublicBlogListing applies category, tag, featured, query, and sort filters to posts and totals', async () => {
  const categoryResult = await getPublicBlogListing(repository(posts), { category: 'development' })
  assert.deepEqual(categoryResult.posts.map(post => post.id), ['react', 'ops'])
  assert.equal(categoryResult.total, 2)

  const tagResult = await getPublicBlogListing(repository(posts), { tag: 'react' })
  assert.deepEqual(tagResult.posts.map(post => post.id), ['react'])
  assert.equal(tagResult.total, 1)

  const featuredResult = await getPublicBlogListing(repository(posts), { featured: true })
  assert.deepEqual(featuredResult.posts.map(post => post.id), ['ai-new'])
  assert.equal(featuredResult.total, 1)

  const searchResult = await getPublicBlogListing(repository(posts), { query: 'release' })
  assert.deepEqual(searchResult.posts.map(post => post.id), ['ops'])
  assert.equal(searchResult.total, 1)

  const sortedResult = await getPublicBlogListing(repository(posts), {
    sortBy: 'view_count',
    sortOrder: 'desc'
  })
  assert.deepEqual(sortedResult.posts.map(post => post.id), ['react', 'ai-new', 'ops'])
})

test('getPublicBlogListing paginates filtered results using filtered totals', async () => {
  const result = await getPublicBlogListing(repository(posts), {
    category: 'development',
    page: 1,
    limit: 1
  })

  assert.deepEqual(result.posts.map(post => post.id), ['react'])
  assert.equal(result.total, 2)
  assert.equal(result.page, 1)
  assert.equal(result.limit, 1)
  assert.equal(result.totalPages, 2)
  assert.equal(result.hasMore, true)
})

test('getPublicBlogListing handles empty filtered results intentionally', async () => {
  const result = await getPublicBlogListing(repository(posts), { tag: 'missing' })

  assert.deepEqual(result.posts, [])
  assert.equal(result.total, 0)
  assert.equal(result.totalPages, 0)
  assert.equal(result.hasMore, false)
})
